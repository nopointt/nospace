import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { requireAuth } from "~/lib/auth-guard";
import { sources, projectSchemas, extractedEntities } from "~/lib/schema";
import { eq, and } from "drizzle-orm";
import { mapEntitiesToFrames } from "~/lib/canvas/entity-mapper";

// POST /api/kb/[kbId]/canvas/auto-layout — generate initial frame positions
export async function POST(event: APIEvent) {
  try {
    const tenantId = requireAuth(event);
    const env = getBindings(event);
    const db = createKbDb(env.KB_DB);
    const { kbId } = event.params;

    // Fetch sources
    const sourceRows = await db
      .select()
      .from(sources)
      .where(
        and(eq(sources.projectId, kbId), eq(sources.tenantId, tenantId)),
      )
      .all();

    // Fetch schemas
    const schemaRows = await db
      .select()
      .from(projectSchemas)
      .where(
        and(
          eq(projectSchemas.projectId, kbId),
          eq(projectSchemas.tenantId, tenantId),
        ),
      )
      .all();

    // Fetch extracted entities
    const entityRows = await db
      .select()
      .from(extractedEntities)
      .where(
        and(
          eq(extractedEntities.projectId, kbId),
          eq(extractedEntities.tenantId, tenantId),
        ),
      )
      .all();

    const frames = mapEntitiesToFrames({
      sources: sourceRows,
      schemas: schemaRows,
      entities: entityRows,
    });

    return Response.json({ data: { frames } });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
