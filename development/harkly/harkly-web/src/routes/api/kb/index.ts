import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { requireAuth } from "~/lib/auth-guard";
import { projects } from "~/lib/schema";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";

// GET /api/kb — list user's knowledge bases
export async function GET(event: APIEvent) {
  const tenantId = await requireAuth(event);
  if (!tenantId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const env = getBindings(event);
  const db = createKbDb(env.KB_DB);

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.tenantId, tenantId))
    .all();

  return new Response(JSON.stringify({ data: rows }), { headers: { "Content-Type": "application/json" } });
}

// POST /api/kb — create knowledge base
export async function POST(event: APIEvent) {
  try {
    const tenantId = await requireAuth(event);
    if (!tenantId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

    const env = getBindings(event);
    const db = createKbDb(env.KB_DB);

    let title = "";
    let description: string | null = null;
    try {
      const body = await event.request.json() as any;
      title = body?.title ?? "";
      description = body?.description ?? null;
    } catch {
      return new Response(JSON.stringify({ error: "Cannot parse body" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    if (!title?.trim()) {
      return new Response(JSON.stringify({ error: "Название обязательно" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const id = ulid();
    await db.insert(projects).values({
      id,
      tenantId,
      title: title.trim(),
      description: description?.trim() ?? null,
    });

    return new Response(JSON.stringify({ data: { id, title } }), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
