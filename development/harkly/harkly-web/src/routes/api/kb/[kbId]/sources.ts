import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { requireAuth } from "~/lib/auth-guard";
import { sources } from "~/lib/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/kb/[kbId]/sources — list sources in knowledge base
export async function GET(event: APIEvent) {
  try {
    const tenantId = await requireAuth(event);
    const env = getBindings(event);
    const db = createKbDb(env.KB_DB);
  const kbId = event.params.kbId;

  const rows = await db
    .select()
    .from(sources)
    .where(and(eq(sources.projectId, kbId), eq(sources.tenantId, tenantId)))
    .orderBy(desc(sources.createdAt))
    .all();

  return Response.json({ data: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
