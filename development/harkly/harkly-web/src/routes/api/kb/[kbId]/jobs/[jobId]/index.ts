import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { ingestJobs } from "~/lib/schema";
import { eq } from "drizzle-orm";

// GET /api/kb/[kbId]/jobs/[jobId] — single job detail
export async function GET(event: APIEvent) {
  const env = getBindings(event);
  const db = createKbDb(env.KB_DB);
  const { jobId } = event.params;

  const [job] = await db
    .select()
    .from(ingestJobs)
    .where(eq(ingestJobs.id, jobId))
    .limit(1);

  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  return Response.json({ data: job });
}
