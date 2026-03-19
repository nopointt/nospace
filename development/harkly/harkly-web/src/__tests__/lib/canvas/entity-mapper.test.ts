import { describe, it, expect } from "vitest";
import { mapEntitiesToFrames } from "~/lib/canvas/entity-mapper";
import { WINDOW_DEFAULT_WIDTH, WINDOW_DEFAULT_HEIGHT } from "~/lib/canvas/constants";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const makeSources = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `src-${i}`,
    title: `Source ${i}`,
    type: "url",
    status: "ready",
    mimeType: "text/html",
  }));

const makeSchemas = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `sch-${i}`,
    name: `Schema ${i}`,
    status: "active",
  }));

const makeEntities = (
  schemaId: string,
  count: number,
  entityType = "person",
) =>
  Array.from({ length: count }, (_, i) => ({
    id: `ent-${schemaId}-${i}`,
    entityType,
    data: JSON.stringify({ name: `Entity ${i}` }),
    schemaId,
  }));

// ── Empty input ───────────────────────────────────────────────────────────────

describe("mapEntitiesToFrames — empty input", () => {
  it("returns an empty array when all inputs are empty", () => {
    const result = mapEntitiesToFrames({ sources: [], schemas: [], entities: [] });
    expect(result).toEqual([]);
  });

  it("returns only source frames when schemas and entities are empty", () => {
    const result = mapEntitiesToFrames({ sources: makeSources(2), schemas: [], entities: [] });
    expect(result).toHaveLength(2);
    expect(result.every((f) => f.module === "source-card")).toBe(true);
  });

  it("returns only schema frames when sources and entities are empty", () => {
    const result = mapEntitiesToFrames({ sources: [], schemas: makeSchemas(2), entities: [] });
    expect(result).toHaveLength(2);
    expect(result.every((f) => f.module === "panel")).toBe(true);
  });

  it("returns no insight frames when entities are empty", () => {
    const result = mapEntitiesToFrames({ sources: [], schemas: [], entities: [] });
    expect(result.filter((f) => f.module === "insights")).toHaveLength(0);
  });
});

// ── Sources → SourceCard frames (floor 2) ────────────────────────────────────

describe("mapEntitiesToFrames — sources", () => {
  it("produces one frame per source", () => {
    const result = mapEntitiesToFrames({ sources: makeSources(3), schemas: [], entities: [] });
    expect(result).toHaveLength(3);
  });

  it("assigns id prefixed with 'source-'", () => {
    const result = mapEntitiesToFrames({ sources: makeSources(1), schemas: [], entities: [] });
    expect(result[0].id).toBe("source-src-0");
  });

  it("sets module to 'source-card'", () => {
    const result = mapEntitiesToFrames({ sources: makeSources(1), schemas: [], entities: [] });
    expect(result[0].module).toBe("source-card");
  });

  it("places source frames on floor 2", () => {
    const result = mapEntitiesToFrames({ sources: makeSources(2), schemas: [], entities: [] });
    expect(result.every((f) => f.floor === 2)).toBe(true);
  });

  it("uses source title when available", () => {
    const result = mapEntitiesToFrames({ sources: makeSources(1), schemas: [], entities: [] });
    expect(result[0].title).toBe("Source 0");
  });

  it("falls back to type when title is null", () => {
    const source = { id: "s1", title: null, type: "pdf", status: "ready" };
    const result = mapEntitiesToFrames({ sources: [source], schemas: [], entities: [] });
    expect(result[0].title).toBe("pdf");
  });

  it("height of source frame is 200", () => {
    const result = mapEntitiesToFrames({ sources: makeSources(1), schemas: [], entities: [] });
    expect(result[0].height).toBe(200);
  });

  it("width of source frame equals WINDOW_DEFAULT_WIDTH", () => {
    const result = mapEntitiesToFrames({ sources: makeSources(1), schemas: [], entities: [] });
    expect(result[0].width).toBe(WINDOW_DEFAULT_WIDTH);
  });

  it("frameData encodes sourceId, status and mimeType", () => {
    const result = mapEntitiesToFrames({ sources: makeSources(1), schemas: [], entities: [] });
    const data = JSON.parse(result[0].frameData!);
    expect(data.sourceId).toBe("src-0");
    expect(data.status).toBe("ready");
    expect(data.mimeType).toBe("text/html");
  });
});

// ── Schemas → Panel frames (floor 0) ─────────────────────────────────────────

describe("mapEntitiesToFrames — schemas", () => {
  it("produces one frame per schema", () => {
    const result = mapEntitiesToFrames({ sources: [], schemas: makeSchemas(4), entities: [] });
    expect(result).toHaveLength(4);
  });

  it("assigns id prefixed with 'schema-'", () => {
    const result = mapEntitiesToFrames({ sources: [], schemas: makeSchemas(1), entities: [] });
    expect(result[0].id).toBe("schema-sch-0");
  });

  it("sets module to 'panel'", () => {
    const result = mapEntitiesToFrames({ sources: [], schemas: makeSchemas(1), entities: [] });
    expect(result[0].module).toBe("panel");
  });

  it("places schema frames on floor 0", () => {
    const result = mapEntitiesToFrames({ sources: [], schemas: makeSchemas(2), entities: [] });
    expect(result.every((f) => f.floor === 0)).toBe(true);
  });

  it("title matches the schema name", () => {
    const result = mapEntitiesToFrames({ sources: [], schemas: makeSchemas(1), entities: [] });
    expect(result[0].title).toBe("Schema 0");
  });

  it("dimensions equal WINDOW_DEFAULT_WIDTH x WINDOW_DEFAULT_HEIGHT", () => {
    const result = mapEntitiesToFrames({ sources: [], schemas: makeSchemas(1), entities: [] });
    expect(result[0].width).toBe(WINDOW_DEFAULT_WIDTH);
    expect(result[0].height).toBe(WINDOW_DEFAULT_HEIGHT);
  });

  it("frameData encodes schemaId and status", () => {
    const result = mapEntitiesToFrames({ sources: [], schemas: makeSchemas(1), entities: [] });
    const data = JSON.parse(result[0].frameData!);
    expect(data.schemaId).toBe("sch-0");
    expect(data.status).toBe("active");
  });
});

// ── Entities → Insights frames (floor 3) ─────────────────────────────────────

describe("mapEntitiesToFrames — entities", () => {
  it("produces one insights frame per unique schemaId", () => {
    const entities = [
      ...makeEntities("schema-a", 3),
      ...makeEntities("schema-b", 2),
    ];
    const result = mapEntitiesToFrames({ sources: [], schemas: [], entities });
    const insightFrames = result.filter((f) => f.module === "insights");
    expect(insightFrames).toHaveLength(2);
  });

  it("places insights frames on floor 3", () => {
    const result = mapEntitiesToFrames({
      sources: [],
      schemas: [],
      entities: makeEntities("schema-a", 1),
    });
    expect(result[0].floor).toBe(3);
  });

  it("assigns id prefixed with 'insights-'", () => {
    const result = mapEntitiesToFrames({
      sources: [],
      schemas: [],
      entities: makeEntities("schema-x", 2),
    });
    expect(result[0].id).toBe("insights-schema-x");
  });

  it("title encodes entityType and count", () => {
    const result = mapEntitiesToFrames({
      sources: [],
      schemas: [],
      entities: makeEntities("sch-1", 5, "company"),
    });
    expect(result[0].title).toBe("company (5)");
  });

  it("frameData encodes schemaId, entityCount and all entityIds", () => {
    const entities = makeEntities("sch-1", 3);
    const result = mapEntitiesToFrames({ sources: [], schemas: [], entities });
    const data = JSON.parse(result[0].frameData!);
    expect(data.schemaId).toBe("sch-1");
    expect(data.entityCount).toBe(3);
    expect(data.entityIds).toHaveLength(3);
    expect(data.entityIds).toContain("ent-sch-1-0");
  });
});

// ── Grid layout / auto-position ───────────────────────────────────────────────

describe("mapEntitiesToFrames — grid layout", () => {
  const START_X = 40;
  const START_Y = 40;
  const COLUMN_COUNT = 3;
  const GAP = 20;
  const FRAME_W = WINDOW_DEFAULT_WIDTH;
  const FRAME_H = WINDOW_DEFAULT_HEIGHT;

  it("first frame is placed at START_X, START_Y", () => {
    const result = mapEntitiesToFrames({ sources: makeSources(1), schemas: [], entities: [] });
    expect(result[0].x).toBe(START_X);
    expect(result[0].y).toBe(START_Y);
  });

  it("second frame is placed in column 1 (x shifted by FRAME_W + GAP)", () => {
    const result = mapEntitiesToFrames({ sources: makeSources(2), schemas: [], entities: [] });
    expect(result[1].x).toBe(START_X + FRAME_W + GAP);
    expect(result[1].y).toBe(START_Y);
  });

  it("fourth frame wraps to row 1 (y shifted by FRAME_H + GAP)", () => {
    const result = mapEntitiesToFrames({ sources: makeSources(4), schemas: [], entities: [] });
    const fourth = result[3];
    // col = 3 % 3 = 0, row = Math.floor(3 / 3) = 1
    expect(fourth.x).toBe(START_X);
    expect(fourth.y).toBe(START_Y + FRAME_H + GAP);
  });

  it("third frame lands in column 2 (last column)", () => {
    const result = mapEntitiesToFrames({ sources: makeSources(3), schemas: [], entities: [] });
    const third = result[2];
    expect(third.x).toBe(START_X + 2 * (FRAME_W + GAP));
    expect(third.y).toBe(START_Y);
  });

  it("each entity group uses its own independent index (starts at 0)", () => {
    // With no sources/schemas before them, first insights frame is at column 0
    const entities = makeEntities("sch-a", 2);
    const result = mapEntitiesToFrames({ sources: [], schemas: [], entities });
    expect(result[0].x).toBe(START_X);
    expect(result[0].y).toBe(START_Y);
  });

  it("schemas use their own independent column counter", () => {
    // Two schemas — each column index is per-kind not shared
    const result = mapEntitiesToFrames({ sources: [], schemas: makeSchemas(2), entities: [] });
    expect(result[0].x).toBe(START_X);
    expect(result[1].x).toBe(START_X + FRAME_W + GAP);
  });
});

// ── Mixed input ───────────────────────────────────────────────────────────────

describe("mapEntitiesToFrames — mixed input", () => {
  it("total frame count equals sources + schemas + unique schema groups", () => {
    const sources = makeSources(2);
    const schemas = makeSchemas(1);
    const entities = [
      ...makeEntities("sch-a", 3),
      ...makeEntities("sch-b", 1),
    ];
    const result = mapEntitiesToFrames({ sources, schemas, entities });
    // 2 source-cards + 1 panel + 2 insights groups = 5
    expect(result).toHaveLength(5);
  });

  it("all three module types are present", () => {
    const result = mapEntitiesToFrames({
      sources: makeSources(1),
      schemas: makeSchemas(1),
      entities: makeEntities("sch-x", 2),
    });
    const modules = new Set(result.map((f) => f.module));
    expect(modules.has("source-card")).toBe(true);
    expect(modules.has("panel")).toBe(true);
    expect(modules.has("insights")).toBe(true);
  });

  it("returns a new array — immutable output", () => {
    const input = { sources: makeSources(1), schemas: [], entities: [] };
    const r1 = mapEntitiesToFrames(input);
    const r2 = mapEntitiesToFrames(input);
    expect(r1).not.toBe(r2);
  });
});
