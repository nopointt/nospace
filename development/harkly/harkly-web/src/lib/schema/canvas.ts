import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { projects } from "./core";

const createdAt = () => text("created_at").notNull().default(sql`(datetime('now'))`);
const updatedAt = () => text("updated_at").notNull().default(sql`(datetime('now'))`);

// ── Canvas Frames ────────────────────────────────────────────
export const canvasFrames = sqliteTable(
  "canvas_frames",
  {
    id: text("id").primaryKey().notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull(),
    module: text("module").notNull(),
    title: text("title").notNull(),
    x: real("x").notNull().default(0),
    y: real("y").notNull().default(0),
    width: real("width").notNull().default(600),
    height: real("height").notNull().default(480),
    zIndex: integer("z_index").notNull().default(0),
    minimized: integer("minimized").notNull().default(0),
    floor: integer("floor").notNull().default(0),
    frameData: text("frame_data"), // JSON
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("idx_frames_project").on(t.projectId),
    index("idx_frames_tenant").on(t.tenantId),
  ],
);

// ── Canvas Viewports ─────────────────────────────────────────
export const canvasViewports = sqliteTable(
  "canvas_viewports",
  {
    id: text("id").primaryKey().notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull(),
    floor: integer("floor").notNull().default(0),
    panX: real("pan_x").notNull().default(0),
    panY: real("pan_y").notNull().default(0),
    zoom: real("zoom").notNull().default(1.0),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("idx_viewports_project").on(t.projectId, t.tenantId),
    uniqueIndex("uq_viewport_project_tenant_floor").on(
      t.projectId,
      t.tenantId,
      t.floor,
    ),
  ],
);
