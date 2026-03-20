import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { requireAuth } from "~/lib/auth-guard";
import { projectSchemas } from "~/lib/schema";
import { eq, and } from "drizzle-orm";

// POST /api/kb/[kbId]/schemas/[schemaId]/confirm — confirm schema
export async function POST(event: APIEvent) {
  const userId = await requireAuth(event);
  const env = getBindings(event);
  const db = createKbDb(env.KB_DB);
  const { schemaId } = event.params;

  const [schema] = await db
    .select()
    .from(projectSchemas)
    .where(and(eq(projectSchemas.id, schemaId), eq(projectSchemas.tenantId, userId)))
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
    .where(and(eq(projectSchemas.id, schemaId), eq(projectSchemas.tenantId, userId)));

  return Response.json({ data: { schemaId, status: "confirmed" } });
}
