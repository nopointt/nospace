import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { requireAuth } from "~/lib/auth-guard";
import { projectSchemas, schemaFields } from "~/lib/schema";
import { eq, and } from "drizzle-orm";

// GET /api/kb/[kbId]/schemas — list schemas
export async function GET(event: APIEvent) {
  try {
    const tenantId = await requireAuth(event);
    const env = getBindings(event);
    const db = createKbDb(env.KB_DB);
  const { kbId } = event.params;

  const url = new URL(event.request.url);
  const status = url.searchParams.get("status");

  const conditions = [
    eq(projectSchemas.projectId, kbId),
    eq(projectSchemas.tenantId, tenantId),
  ];
  if (status) {
    conditions.push(eq(projectSchemas.status, status));
  }

  const rows = await db
    .select()
    .from(projectSchemas)
    .where(and(...conditions))
    .all();

  return Response.json({ data: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
