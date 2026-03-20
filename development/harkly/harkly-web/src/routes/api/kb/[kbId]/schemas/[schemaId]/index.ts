import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { requireAuth } from "~/lib/auth-guard";
import { projectSchemas, schemaFields } from "~/lib/schema";
import { eq, and } from "drizzle-orm";
import { ulid } from "ulid";

// GET /api/kb/[kbId]/schemas/[schemaId] — schema with fields
export async function GET(event: APIEvent) {
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

  const fields = await db
    .select()
    .from(schemaFields)
    .where(eq(schemaFields.schemaId, schemaId))
    .orderBy(schemaFields.sortOrder)
    .all();

  return Response.json({ data: { ...schema, fields } });
}

// PUT /api/kb/[kbId]/schemas/[schemaId] — update fields
export async function PUT(event: APIEvent) {
  const userId = await requireAuth(event);
  const env = getBindings(event);
  const db = createKbDb(env.KB_DB);
  const { schemaId } = event.params;

  // Verify ownership before mutating
  const [existing] = await db
    .select()
    .from(projectSchemas)
    .where(and(eq(projectSchemas.id, schemaId), eq(projectSchemas.tenantId, userId)))
    .limit(1);

  if (!existing) {
    return Response.json({ error: "Schema not found" }, { status: 404 });
  }

  const body = await event.request.json();
  const { fields: newFields, name } = body as {
    fields: Array<{
      name: string;
      type: string;
      description?: string;
      required?: boolean;
      enumValues?: string[];
    }>;
    name?: string;
  };

  // Update schema name if provided
  if (name) {
    await db
      .update(projectSchemas)
      .set({ name, updatedAt: new Date().toISOString() })
      .where(and(eq(projectSchemas.id, schemaId), eq(projectSchemas.tenantId, userId)));
  }

  // Delete existing fields and re-insert
  await db.delete(schemaFields).where(eq(schemaFields.schemaId, schemaId));

  for (let i = 0; i < newFields.length; i++) {
    const f = newFields[i];
    await db.insert(schemaFields).values({
      id: ulid(),
      schemaId,
      name: f.name,
      type: f.type,
      description: f.description ?? null,
      required: f.required ? 1 : 0,
      enumValues: f.enumValues ? JSON.stringify(f.enumValues) : null,
      sortOrder: i,
    });
  }

  return Response.json({ data: { schemaId, fieldsCount: newFields.length } });
}
