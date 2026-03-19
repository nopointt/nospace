import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { requireAuth } from "~/lib/auth-guard";
import { projects } from "~/lib/schema";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";

// GET /api/kb — list user's knowledge bases
export async function GET(event: APIEvent) {
  try {
    const tenantId = requireAuth(event);
    const env = getBindings(event);
    const db = createKbDb(env.KB_DB);

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.tenantId, tenantId))
    .all();

  return Response.json({ data: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

// POST /api/kb — create knowledge base
export async function POST(event: APIEvent) {
  try {
    const tenantId = requireAuth(event);
    const env = getBindings(event);
    const db = createKbDb(env.KB_DB);

  const body = await event.request.json();
  const { title, description } = body as { title: string; description?: string };

  if (!title?.trim()) {
    return Response.json({ error: "Название обязательно" }, { status: 400 });
  }

  const id = ulid();
  await db.insert(projects).values({
    id,
    tenantId,
    title: title.trim(),
    description: description?.trim() ?? null,
  });

  return Response.json({ data: { id, title } }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
