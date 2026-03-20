import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { requireAuth } from "~/lib/auth-guard";
import { documentChunks, projectSchemas, schemaFields } from "~/lib/schema";
import { eq, and } from "drizzle-orm";
import { ulid } from "ulid";

interface SchemaField {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  enumValues?: string[];
}

// POST /api/kb/[kbId]/schema/discover — AI schema discovery
export async function POST(event: APIEvent) {
  try {
    const tenantId = await requireAuth(event);
    const env = getBindings(event);
    const db = createKbDb(env.KB_DB);
  const { kbId } = event.params;

  // 1. Sample chunks from KB
  const chunks = await db
    .select()
    .from(documentChunks)
    .where(eq(documentChunks.projectId, kbId))
    .limit(5)
    .all();

  if (chunks.length === 0) {
    return Response.json(
      { error: "Нет документов для анализа. Загрузите файлы сначала." },
      { status: 400 },
    );
  }

  const samples = chunks.map((c) => c.content.substring(0, 3000));

  // 2. Build discovery prompt
  const systemPrompt = `You are a schema architect. Analyze the document samples and propose a structured schema for extracting key information.

Output a JSON array of fields with this structure:
[
  { "name": "field_name", "type": "string|number|boolean|date|enum", "description": "what this field contains", "required": true/false }
]

Rules:
- Use snake_case for field names
- Propose 5-15 most important fields
- Choose the most specific type for each field
- Set required=true only for fields present in most documents
- Output ONLY the JSON array, no other text`;

  const userPrompt = `Document samples:\n\n${samples.map((s, i) => `--- Sample ${i + 1} ---\n${s}`).join("\n\n")}`;

  // 3. Call Workers AI
  const result = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast" as any, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  // 4. Parse LLM response
  let fields: SchemaField[] = [];
  try {
    const responseText = (result as any).response || "";
    // Strip markdown fences
    const cleaned = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    fields = JSON.parse(cleaned);
  } catch {
    return Response.json(
      { error: "AI не смог предложить схему. Попробуйте ещё раз." },
      { status: 500 },
    );
  }

  if (!Array.isArray(fields) || fields.length === 0) {
    return Response.json(
      { error: "AI вернул пустую схему. Попробуйте с другими документами." },
      { status: 500 },
    );
  }

  // 5. Store schema + fields
  const schemaId = ulid();
  await db.insert(projectSchemas).values({
    id: schemaId,
    projectId: kbId,
    tenantId,
    name: "Обнаруженная схема",
    status: "draft",
    modelUsed: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  });

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    await db.insert(schemaFields).values({
      id: ulid(),
      schemaId,
      name: f.name || `field_${i}`,
      type: f.type || "string",
      description: f.description ?? null,
      required: f.required ? 1 : 0,
      enumValues: f.enumValues ? JSON.stringify(f.enumValues) : null,
      sortOrder: i,
    });
  }

  // 6. Return schema with fields
  const storedFields = await db
    .select()
    .from(schemaFields)
    .where(eq(schemaFields.schemaId, schemaId))
    .orderBy(schemaFields.sortOrder)
    .all();

  return Response.json({
    data: {
      id: schemaId,
      name: "Обнаруженная схема",
      status: "draft",
      fields: storedFields,
    },
  });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
