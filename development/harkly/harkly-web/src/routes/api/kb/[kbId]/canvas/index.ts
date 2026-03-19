import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { requireAuth } from "~/lib/auth-guard";
import { canvasFrames, canvasViewports } from "~/lib/schema";
import { eq, and } from "drizzle-orm";
import { ulid } from "ulid";

// GET /api/kb/[kbId]/canvas — load canvas state (frames + viewport)
export async function GET(event: APIEvent) {
  try {
    const tenantId = requireAuth(event);
    const env = getBindings(event);
    const db = createKbDb(env.KB_DB);
    const { kbId } = event.params;

    const frames = await db
      .select()
      .from(canvasFrames)
      .where(
        and(
          eq(canvasFrames.projectId, kbId),
          eq(canvasFrames.tenantId, tenantId),
        ),
      )
      .all();

    const viewportRows = await db
      .select()
      .from(canvasViewports)
      .where(
        and(
          eq(canvasViewports.projectId, kbId),
          eq(canvasViewports.tenantId, tenantId),
        ),
      )
      .all();

    // Return first viewport (floor 0) or default
    const viewport = viewportRows[0] ?? null;

    return Response.json({
      data: {
        frames,
        viewport,
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

// PUT /api/kb/[kbId]/canvas — save canvas state (frames + viewport)
export async function PUT(event: APIEvent) {
  try {
    const tenantId = requireAuth(event);
    const env = getBindings(event);
    const db = createKbDb(env.KB_DB);
    const { kbId } = event.params;

    const body = (await event.request.json()) as {
      frames?: Array<{
        id: string;
        module: string;
        title: string;
        x: number;
        y: number;
        width: number;
        height: number;
        zIndex?: number;
        minimized?: boolean;
        floor?: number;
        frameData?: string;
      }>;
      viewport?: {
        panX: number;
        panY: number;
        zoom: number;
        floor?: number;
      };
    };

    // Save frames — delete existing and insert new
    if (body.frames) {
      await db
        .delete(canvasFrames)
        .where(
          and(
            eq(canvasFrames.projectId, kbId),
            eq(canvasFrames.tenantId, tenantId),
          ),
        );

      if (body.frames.length > 0) {
        const frameRows = body.frames.map((f) => ({
          id: f.id || ulid(),
          projectId: kbId,
          tenantId,
          module: f.module,
          title: f.title,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          zIndex: f.zIndex ?? 0,
          minimized: f.minimized ? 1 : 0,
          floor: f.floor ?? 0,
          frameData: f.frameData ?? null,
        }));

        await db.insert(canvasFrames).values(frameRows);
      }
    }

    // Save viewport — upsert
    if (body.viewport) {
      const floor = body.viewport.floor ?? 0;
      const existingViewport = await db
        .select()
        .from(canvasViewports)
        .where(
          and(
            eq(canvasViewports.projectId, kbId),
            eq(canvasViewports.tenantId, tenantId),
            eq(canvasViewports.floor, floor),
          ),
        )
        .get();

      if (existingViewport) {
        await db
          .update(canvasViewports)
          .set({
            panX: body.viewport.panX,
            panY: body.viewport.panY,
            zoom: body.viewport.zoom,
          })
          .where(eq(canvasViewports.id, existingViewport.id));
      } else {
        await db.insert(canvasViewports).values({
          id: ulid(),
          projectId: kbId,
          tenantId,
          floor,
          panX: body.viewport.panX,
          panY: body.viewport.panY,
          zoom: body.viewport.zoom,
        });
      }
    }

    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
