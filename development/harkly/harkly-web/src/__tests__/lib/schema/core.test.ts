import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { projects, sources, documents, documentChunks } from "~/lib/schema/core";

// ── projects ──────────────────────────────────────────────────────────────────

describe("schema/core — projects table", () => {
  it("table name is 'projects'", () => {
    expect(getTableName(projects)).toBe("projects");
  });

  it("exports a Drizzle table object (truthy)", () => {
    expect(projects).toBeTruthy();
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(projects));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "tenantId",
        "title",
        "description",
        "frameType",
        "frameData",
        "status",
        "createdAt",
        "updatedAt",
      ]),
    );
  });

  it("id column is primary key and not null", () => {
    const cols = getTableColumns(projects);
    expect(cols.id.primary).toBe(true);
    expect(cols.id.notNull).toBe(true);
  });

  it("tenantId column is not null", () => {
    expect(getTableColumns(projects).tenantId.notNull).toBe(true);
  });

  it("title column is not null", () => {
    expect(getTableColumns(projects).title.notNull).toBe(true);
  });

  it("description column is nullable (notNull = false)", () => {
    expect(getTableColumns(projects).description.notNull).toBe(false);
  });

  it("status column has a default value", () => {
    expect(getTableColumns(projects).status.hasDefault).toBe(true);
  });

  it("frameData column is nullable", () => {
    expect(getTableColumns(projects).frameData.notNull).toBe(false);
  });

  it("createdAt has a default (SQL datetime)", () => {
    expect(getTableColumns(projects).createdAt.hasDefault).toBe(true);
  });
});

// ── sources ───────────────────────────────────────────────────────────────────

describe("schema/core — sources table", () => {
  it("table name is 'sources'", () => {
    expect(getTableName(sources)).toBe("sources");
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(sources));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "projectId",
        "tenantId",
        "type",
        "title",
        "url",
        "r2Key",
        "mimeType",
        "fileSize",
        "status",
        "errorMessage",
        "metadata",
        "createdAt",
        "updatedAt",
      ]),
    );
  });

  it("id is primary key and not null", () => {
    const cols = getTableColumns(sources);
    expect(cols.id.primary).toBe(true);
    expect(cols.id.notNull).toBe(true);
  });

  it("projectId is not null (FK to projects)", () => {
    expect(getTableColumns(sources).projectId.notNull).toBe(true);
  });

  it("type column is not null", () => {
    expect(getTableColumns(sources).type.notNull).toBe(true);
  });

  it("title is nullable", () => {
    expect(getTableColumns(sources).title.notNull).toBe(false);
  });

  it("status has a default value", () => {
    expect(getTableColumns(sources).status.hasDefault).toBe(true);
  });

  it("fileSize is stored as integer column type", () => {
    expect(getTableColumns(sources).fileSize.columnType).toBe("SQLiteInteger");
  });

  it("metadata is nullable (JSON blob stored as text)", () => {
    expect(getTableColumns(sources).metadata.notNull).toBe(false);
  });
});

// ── documents ─────────────────────────────────────────────────────────────────

describe("schema/core — documents table", () => {
  it("table name is 'documents'", () => {
    expect(getTableName(documents)).toBe("documents");
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(documents));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "projectId",
        "sourceId",
        "tenantId",
        "title",
        "content",
        "wordCount",
        "language",
        "screeningStatus",
        "screeningReason",
        "relevanceScore",
        "metadata",
        "createdAt",
        "updatedAt",
      ]),
    );
  });

  it("content is not null", () => {
    expect(getTableColumns(documents).content.notNull).toBe(true);
  });

  it("language has a default value", () => {
    expect(getTableColumns(documents).language.hasDefault).toBe(true);
  });

  it("screeningStatus has a default value", () => {
    expect(getTableColumns(documents).screeningStatus.hasDefault).toBe(true);
  });

  it("relevanceScore is a real (float) column", () => {
    expect(getTableColumns(documents).relevanceScore.columnType).toBe("SQLiteReal");
  });

  it("wordCount is an integer column", () => {
    expect(getTableColumns(documents).wordCount.columnType).toBe("SQLiteInteger");
  });
});

// ── documentChunks ────────────────────────────────────────────────────────────

describe("schema/core — document_chunks table", () => {
  it("table name is 'document_chunks'", () => {
    expect(getTableName(documentChunks)).toBe("document_chunks");
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(documentChunks));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "documentId",
        "projectId",
        "tenantId",
        "chunkIndex",
        "content",
        "tokenCount",
        "createdAt",
      ]),
    );
  });

  it("chunkIndex is not null integer", () => {
    const col = getTableColumns(documentChunks).chunkIndex;
    expect(col.notNull).toBe(true);
    expect(col.columnType).toBe("SQLiteInteger");
  });

  it("content is not null", () => {
    expect(getTableColumns(documentChunks).content.notNull).toBe(true);
  });

  it("tokenCount is a nullable integer", () => {
    const col = getTableColumns(documentChunks).tokenCount;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(false);
  });
});
