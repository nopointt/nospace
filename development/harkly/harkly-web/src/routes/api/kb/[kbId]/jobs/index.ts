import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { ingestJobs, ingestRuns } from "~/lib/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/kb/[kbId]/jobs — list recent jobs
export async function GET(event: APIEvent) {
  const env = getBindings(event);
  const db = createKbDb(env.KB_DB);
  const tenantId = "demo-user";

  const rows = await db
    .select()
    .from(ingestJobs)
    .where(eq(ingestJobs.tenantId, tenantId))
    .orderBy(desc(ingestJobs.createdAt))
    .limit(50)
    .all();

  return Response.json({ data: rows });
}
