import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import {
  projectSchemas,
  schemaFields,
  documents,
  documentChunks,
  extractedEntities,
  ingestRuns,
  ingestJobs,
} from "~/lib/schema";
import { eq, and } from "drizzle-orm";
import { ulid } from "ulid";

// POST /api/kb/[kbId]/extract — run extraction with a confirmed schema
export async function POST(event: APIEvent) {
  const env = getBindings(event);
  const db = createKbDb(env.KB_DB);
  const tenantId = "demo-user";
  const { kbId } = event.params;

  const body = await event.request.json();
  const { schemaId } = body as { schemaId: string };

  if (!schemaId) {
    return Response.json({ error: "schemaId обязателен" }, { status: 400 });
  }

  // Verify schema is confirmed
  const [schema] = await db
    .select()
    .from(projectSchemas)
    .where(and(eq(projectSchemas.id, schemaId), eq(projectSchemas.status, "confirmed")))
    .limit(1);

  if (!schema) {
    return Response.json(
      { error: "Схема не найдена или не подтверждена" },
      { status: 400 },
    );
  }

  // Load fields
  const fields = await db
    .select()
    .from(schemaFields)
    .where(eq(schemaFields.schemaId, schemaId))
    .orderBy(schemaFields.sortOrder)
    .all();

  // Load documents
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.projectId, kbId))
    .all();

  if (docs.length === 0) {
    return Response.json({ error: "Нет документов для экстракции" }, { status: 400 });
  }

  // Create ingest run
  const runId = ulid();
  await db.insert(ingestRuns).values({
    id: runId,
    projectId: kbId,
    tenantId,
    runType: "extraction",
    status: "running",
    totalItems: docs.length,
    startedAt: new Date().toISOString(),
  });

  // Build schema description for LLM
  const schemaDesc = fields
    .map((f) => `- ${f.name} (${f.type}${f.required ? ", required" : ""}): ${f.description || ""}`)
    .join("\n");

  const systemPrompt = `You are a structured data extractor. Extract data from text according to this schema:

${schemaDesc}

Output a JSON object with the field names as keys. Use null for missing fields. Output ONLY the JSON object.`;

  let processedItems = 0;
  let failedItems = 0;

  // Process each document
  for (const doc of docs) {
    try {
      // Get chunks for this document
      const chunks = await db
        .select()
        .from(documentChunks)
        .where(eq(documentChunks.documentId, doc.id))
        .orderBy(documentChunks.chunkIndex)
        .all();

      // Extract from each chunk
      for (const chunk of chunks) {
        try {
          const result = await env.AI.run(
            "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as any,
            {
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: chunk.content },
              ],
            },
          );

          const responseText = (result as any).response || "";
          const cleaned = responseText
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .trim();

          let parsed: Record<string, any>;
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            continue; // Skip unparseable chunks
          }

          // Check if we got meaningful data (not all null)
          const hasData = Object.values(parsed).some((v) => v !== null && v !== "");
          if (!hasData) continue;

          await db.insert(extractedEntities).values({
            id: ulid(),
            projectId: kbId,
            schemaId,
            documentId: doc.id,
            tenantId,
            entityType: schema.name,
            data: JSON.stringify(parsed),
            confidence: 0.75,
            evidence: chunk.content.substring(0, 500),
          });
        } catch {
          // Skip failed chunks, continue extraction
        }
      }

      processedItems++;
    } catch {
      failedItems++;
    }

    // Update progress
    await db
      .update(ingestRuns)
      .set({ processedItems, failedItems })
      .where(eq(ingestRuns.id, runId));
  }

  // Mark run as completed
  await db
    .update(ingestRuns)
    .set({
      status: failedItems === docs.length ? "failed" : "completed",
      processedItems,
      failedItems,
      completedAt: new Date().toISOString(),
    })
    .where(eq(ingestRuns.id, runId));

  return Response.json({
    data: {
      runId,
      status: "completed",
      processedItems,
      failedItems,
      totalItems: docs.length,
    },
  });
}
