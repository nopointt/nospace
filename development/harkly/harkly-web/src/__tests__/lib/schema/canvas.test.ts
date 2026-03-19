import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { canvasFrames, canvasViewports } from "~/lib/schema/canvas";

// ── canvasFrames ──────────────────────────────────────────────────────────────

describe("schema/canvas — canvas_frames table", () => {
  it("table name is 'canvas_frames'", () => {
    expect(getTableName(canvasFrames)).toBe("canvas_frames");
  });

  it("exports a truthy Drizzle table object", () => {
    expect(canvasFrames).toBeTruthy();
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(canvasFrames));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "projectId",
        "tenantId",
        "module",
        "title",
        "x",
        "y",
        "width",
        "height",
        "zIndex",
        "minimized",
        "floor",
        "frameData",
        "createdAt",
        "updatedAt",
      ]),
    );
  });

  it("id is primary key and not null", () => {
    const cols = getTableColumns(canvasFrames);
    expect(cols.id.primary).toBe(true);
    expect(cols.id.notNull).toBe(true);
  });

  it("module is not null", () => {
    expect(getTableColumns(canvasFrames).module.notNull).toBe(true);
  });

  it("title is not null", () => {
    expect(getTableColumns(canvasFrames).title.notNull).toBe(true);
  });

  it("x is a real column with default 0", () => {
    const col = getTableColumns(canvasFrames).x;
    expect(col.columnType).toBe("SQLiteReal");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it("y is a real column with default 0", () => {
    const col = getTableColumns(canvasFrames).y;
    expect(col.columnType).toBe("SQLiteReal");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it("width is a real column with a default", () => {
    const col = getTableColumns(canvasFrames).width;
    expect(col.columnType).toBe("SQLiteReal");
    expect(col.hasDefault).toBe(true);
  });

  it("height is a real column with a default", () => {
    const col = getTableColumns(canvasFrames).height;
    expect(col.columnType).toBe("SQLiteReal");
    expect(col.hasDefault).toBe(true);
  });

  it("zIndex is an integer with default 0", () => {
    const col = getTableColumns(canvasFrames).zIndex;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it("minimized is an integer with default 0 (boolean-as-int)", () => {
    const col = getTableColumns(canvasFrames).minimized;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it("floor is an integer with default 0", () => {
    const col = getTableColumns(canvasFrames).floor;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it("frameData is nullable (optional JSON)", () => {
    expect(getTableColumns(canvasFrames).frameData.notNull).toBe(false);
  });

  it("createdAt has a default (SQL datetime)", () => {
    expect(getTableColumns(canvasFrames).createdAt.hasDefault).toBe(true);
  });
});

// ── canvasViewports ───────────────────────────────────────────────────────────

describe("schema/canvas — canvas_viewports table", () => {
  it("table name is 'canvas_viewports'", () => {
    expect(getTableName(canvasViewports)).toBe("canvas_viewports");
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(canvasViewports));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "projectId",
        "tenantId",
        "floor",
        "panX",
        "panY",
        "zoom",
        "updatedAt",
      ]),
    );
  });

  it("id is primary key", () => {
    expect(getTableColumns(canvasViewports).id.primary).toBe(true);
  });

  it("floor is an integer with default 0", () => {
    const col = getTableColumns(canvasViewports).floor;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it("panX is a real column with default 0", () => {
    const col = getTableColumns(canvasViewports).panX;
    expect(col.columnType).toBe("SQLiteReal");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it("panY is a real column with default 0", () => {
    const col = getTableColumns(canvasViewports).panY;
    expect(col.columnType).toBe("SQLiteReal");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it("zoom is a real column with default 1.0", () => {
    const col = getTableColumns(canvasViewports).zoom;
    expect(col.columnType).toBe("SQLiteReal");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it("projectId is not null", () => {
    expect(getTableColumns(canvasViewports).projectId.notNull).toBe(true);
  });

  it("tenantId is not null", () => {
    expect(getTableColumns(canvasViewports).tenantId.notNull).toBe(true);
  });
});
