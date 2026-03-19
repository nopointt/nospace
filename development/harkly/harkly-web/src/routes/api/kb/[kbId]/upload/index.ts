import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { requireAuth } from "~/lib/auth-guard";
import { sources, ingestJobs } from "~/lib/schema";
import { ulid } from "ulid";
import { AwsClient } from "aws4fetch";

// POST /api/kb/[kbId]/upload — get presigned R2 upload URL
export async function POST(event: APIEvent) {
  try {
    const tenantId = requireAuth(event);
    const env = getBindings(event);
    const db = createKbDb(env.KB_DB);
  const kbId = event.params.kbId;

  const body = await event.request.json();
  const { fileName, contentType } = body as {
    fileName: string;
    contentType: string;
  };

  if (!fileName || !contentType) {
    return Response.json(
      { error: "fileName и contentType обязательны" },
      { status: 400 },
    );
  }

  const sourceId = ulid();
  const ext = fileName.split(".").pop() || "bin";
  const r2Key = `${tenantId}/${kbId}/${sourceId}.${ext}`;

  // Determine source type from MIME
  const typeMap: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/csv": "csv",
    "text/plain": "txt",
    "text/markdown": "txt",
    "application/json": "txt",
    "audio/mpeg": "audio",
    "audio/wav": "audio",
    "audio/mp4": "audio",
  };
  const sourceType = typeMap[contentType] || "txt";

  // Insert source row
  await db.insert(sources).values({
    id: sourceId,
    projectId: kbId,
    tenantId,
    type: sourceType,
    title: fileName,
    r2Key,
    mimeType: contentType,
    status: "pending",
  });

  // Generate presigned URL for direct R2 upload
  // In CF Workers, we use the R2 binding directly — presigned URLs
  // require S3-compatible API. For MVP, we'll use a proxy upload endpoint.
  // The client will PUT to /api/kb/[kbId]/upload/[sourceId] instead.

  return Response.json({
    data: {
      sourceId,
      uploadPath: `/api/kb/${kbId}/upload/${sourceId}`,
      r2Key,
    },
  });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
