import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { projectSchemas } from "~/lib/schema";
import { eq } from "drizzle-orm";

// POST /api/kb/[kbId]/schemas/[schemaId]/confirm — confirm schema
export async function POST(event: APIEvent) {
  const env = getBindings(event);
  const db = createKbDb(env.KB_DB);
  const { schemaId } = event.params;

  const [schema] = await db
    .select()
    .from(projectSchemas)
    .where(eq(projectSchemas.id, schemaId))
    .limit(1);

  if (!schema) {
    return Response.json({ error: "Schema not found" }, { status: 404 });
  }

  if (schema.status === "confirmed") {
    return Response.json({ error: "Schema already confirmed" }, { status: 400 });
  }

  await db
    .update(projectSchemas)
    .set({
      status: "confirmed",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(projectSchemas.id, schemaId));

  return Response.json({ data: { schemaId, status: "confirmed" } });
}
