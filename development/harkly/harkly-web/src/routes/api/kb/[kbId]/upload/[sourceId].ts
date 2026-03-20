import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { requireAuth } from "~/lib/auth-guard";
import { sources, ingestRuns, ingestJobs } from "~/lib/schema";
import { eq, and } from "drizzle-orm";
import { ulid } from "ulid";

// PUT /api/kb/[kbId]/upload/[sourceId] — receive file body, store in R2, enqueue
export async function PUT(event: APIEvent) {
  const userId = await requireAuth(event);
  const env = getBindings(event);
  const db = createKbDb(env.KB_DB);
  const { kbId, sourceId } = event.params;

  // Get source record
  const [source] = await db
    .select()
    .from(sources)
    .where(and(eq(sources.id, sourceId), eq(sources.tenantId, userId)))
    .limit(1);

  if (!source) {
    return Response.json({ error: "Source not found" }, { status: 404 });
  }

  if (!source.r2Key) {
    return Response.json({ error: "No R2 key for source" }, { status: 400 });
  }

  // Store file in R2
  const body = await event.request.arrayBuffer();
  await env.HARKLY_R2.put(source.r2Key, body, {
    httpMetadata: {
      contentType: source.mimeType || "application/octet-stream",
    },
  });

  // Update source with file size
  await db
    .update(sources)
    .set({
      fileSize: body.byteLength,
      status: "processing",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sources.id, sourceId));

  // Create ingest run
  const runId = ulid();
  await db.insert(ingestRuns).values({
    id: runId,
    projectId: kbId,
    tenantId: source.tenantId,
    runType: "source_ingest",
    status: "pending",
    totalItems: 1,
  });

  // Create ingest job
  const jobId = ulid();
  await db.insert(ingestJobs).values({
    id: jobId,
    runId,
    tenantId: source.tenantId,
    jobType: "process_source",
    status: "queued",
    payload: JSON.stringify({ sourceId, kbId }),
  });

  // Enqueue for processing
  await env.INGEST_QUEUE.send({ sourceId });

  return Response.json({
    data: {
      sourceId,
      jobId,
      runId,
      status: "queued",
    },
  });
}
