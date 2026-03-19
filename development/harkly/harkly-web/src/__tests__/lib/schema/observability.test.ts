import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { queryStats, collectionTimestamps } from "~/lib/schema/observability";

// ── queryStats ────────────────────────────────────────────────────────────────

describe("schema/observability — query_stats table", () => {
  it("table name is 'query_stats'", () => {
    expect(getTableName(queryStats)).toBe("query_stats");
  });

  it("exports a truthy Drizzle table object", () => {
    expect(queryStats).toBeTruthy();
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(queryStats));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "projectId",
        "tenantId",
        "query",
        "resultsCount",
        "responseTimeMs",
        "searchType",
        "ftsTimeMs",
        "vectorTimeMs",
        "rrfTimeMs",
        "cacheHit",
        "createdAt",
      ]),
    );
  });

  it("id is primary key and not null", () => {
    const cols = getTableColumns(queryStats);
    expect(cols.id.primary).toBe(true);
    expect(cols.id.notNull).toBe(true);
  });

  it("projectId is not null", () => {
    expect(getTableColumns(queryStats).projectId.notNull).toBe(true);
  });

  it("tenantId is not null", () => {
    expect(getTableColumns(queryStats).tenantId.notNull).toBe(true);
  });

  it("query is not null", () => {
    expect(getTableColumns(queryStats).query.notNull).toBe(true);
  });

  it("resultsCount is an integer with default 0", () => {
    const col = getTableColumns(queryStats).resultsCount;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.hasDefault).toBe(true);
  });

  it("responseTimeMs is a nullable integer", () => {
    const col = getTableColumns(queryStats).responseTimeMs;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(false);
  });

  it("ftsTimeMs is a nullable integer", () => {
    const col = getTableColumns(queryStats).ftsTimeMs;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(false);
  });

  it("vectorTimeMs is a nullable integer", () => {
    const col = getTableColumns(queryStats).vectorTimeMs;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(false);
  });

  it("rrfTimeMs is a nullable integer", () => {
    const col = getTableColumns(queryStats).rrfTimeMs;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(false);
  });

  it("cacheHit is an integer with default 0 (boolean-as-int)", () => {
    const col = getTableColumns(queryStats).cacheHit;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.hasDefault).toBe(true);
  });

  it("searchType is nullable", () => {
    expect(getTableColumns(queryStats).searchType.notNull).toBe(false);
  });

  it("createdAt has a default (SQL datetime)", () => {
    expect(getTableColumns(queryStats).createdAt.hasDefault).toBe(true);
  });
});

// ── collectionTimestamps ──────────────────────────────────────────────────────

describe("schema/observability — collection_timestamps table", () => {
  it("table name is 'collection_timestamps'", () => {
    expect(getTableName(collectionTimestamps)).toBe("collection_timestamps");
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(collectionTimestamps));
    expect(cols).toEqual(
      expect.arrayContaining([
        "sourceId",
        "lastSuccessfulCollection",
        "etag",
        "lastModified",
        "updatedAt",
      ]),
    );
  });

  it("sourceId is the primary key", () => {
    const col = getTableColumns(collectionTimestamps).sourceId;
    expect(col.primary).toBe(true);
    expect(col.notNull).toBe(true);
  });

  it("lastSuccessfulCollection is not null", () => {
    expect(getTableColumns(collectionTimestamps).lastSuccessfulCollection.notNull).toBe(true);
  });

  it("etag is nullable", () => {
    expect(getTableColumns(collectionTimestamps).etag.notNull).toBe(false);
  });

  it("lastModified is nullable", () => {
    expect(getTableColumns(collectionTimestamps).lastModified.notNull).toBe(false);
  });

  it("updatedAt has a default (SQL datetime)", () => {
    expect(getTableColumns(collectionTimestamps).updatedAt.hasDefault).toBe(true);
  });
});
