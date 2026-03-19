import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import { ingestRuns, ingestJobs, workItems } from "~/lib/schema/pipeline";

// ── ingestRuns ────────────────────────────────────────────────────────────────

describe("schema/pipeline — ingest_runs table", () => {
  it("table name is 'ingest_runs'", () => {
    expect(getTableName(ingestRuns)).toBe("ingest_runs");
  });

  it("exports a truthy Drizzle table object", () => {
    expect(ingestRuns).toBeTruthy();
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(ingestRuns));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "projectId",
        "tenantId",
        "runType",
        "status",
        "currentPhase",
        "progressMessage",
        "totalItems",
        "processedItems",
        "failedItems",
        "startedAt",
        "completedAt",
        "errorMessage",
        "createdAt",
      ]),
    );
  });

  it("id is primary key and not null", () => {
    const cols = getTableColumns(ingestRuns);
    expect(cols.id.primary).toBe(true);
    expect(cols.id.notNull).toBe(true);
  });

  it("runType is not null", () => {
    expect(getTableColumns(ingestRuns).runType.notNull).toBe(true);
  });

  it("status has a default value", () => {
    expect(getTableColumns(ingestRuns).status.hasDefault).toBe(true);
  });

  it("totalItems has a default value of 0", () => {
    const col = getTableColumns(ingestRuns).totalItems;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.hasDefault).toBe(true);
  });

  it("processedItems has a default value", () => {
    expect(getTableColumns(ingestRuns).processedItems.hasDefault).toBe(true);
  });

  it("failedItems has a default value", () => {
    expect(getTableColumns(ingestRuns).failedItems.hasDefault).toBe(true);
  });

  it("startedAt is nullable", () => {
    expect(getTableColumns(ingestRuns).startedAt.notNull).toBe(false);
  });

  it("completedAt is nullable", () => {
    expect(getTableColumns(ingestRuns).completedAt.notNull).toBe(false);
  });

  it("currentPhase is nullable", () => {
    expect(getTableColumns(ingestRuns).currentPhase.notNull).toBe(false);
  });
});

// ── ingestJobs ────────────────────────────────────────────────────────────────

describe("schema/pipeline — ingest_jobs table", () => {
  it("table name is 'ingest_jobs'", () => {
    expect(getTableName(ingestJobs)).toBe("ingest_jobs");
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(ingestJobs));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "runId",
        "tenantId",
        "jobType",
        "status",
        "priority",
        "payload",
        "result",
        "retryCount",
        "maxRetries",
        "startedAt",
        "completedAt",
        "errorMessage",
        "createdAt",
      ]),
    );
  });

  it("runId is nullable (FK with set null on delete)", () => {
    expect(getTableColumns(ingestJobs).runId.notNull).toBe(false);
  });

  it("jobType is not null", () => {
    expect(getTableColumns(ingestJobs).jobType.notNull).toBe(true);
  });

  it("status has a default value", () => {
    expect(getTableColumns(ingestJobs).status.hasDefault).toBe(true);
  });

  it("priority is an integer with default 0", () => {
    const col = getTableColumns(ingestJobs).priority;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it("payload is not null (JSON)", () => {
    expect(getTableColumns(ingestJobs).payload.notNull).toBe(true);
  });

  it("result is nullable", () => {
    expect(getTableColumns(ingestJobs).result.notNull).toBe(false);
  });

  it("retryCount is a not-null integer with default", () => {
    const col = getTableColumns(ingestJobs).retryCount;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it("maxRetries is a not-null integer with default", () => {
    const col = getTableColumns(ingestJobs).maxRetries;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });
});

// ── workItems ─────────────────────────────────────────────────────────────────

describe("schema/pipeline — work_items table", () => {
  it("table name is 'work_items'", () => {
    expect(getTableName(workItems)).toBe("work_items");
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(workItems));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "jobId",
        "runId",
        "tenantId",
        "itemType",
        "itemId",
        "status",
        "sourceData",
        "processedData",
        "retryCount",
        "errorMessage",
        "createdAt",
        "processedAt",
      ]),
    );
  });

  it("jobId is not null (FK to ingest_jobs)", () => {
    expect(getTableColumns(workItems).jobId.notNull).toBe(true);
  });

  it("runId is nullable (FK with set null on delete)", () => {
    expect(getTableColumns(workItems).runId.notNull).toBe(false);
  });

  it("itemType is not null", () => {
    expect(getTableColumns(workItems).itemType.notNull).toBe(true);
  });

  it("itemId is not null", () => {
    expect(getTableColumns(workItems).itemId.notNull).toBe(true);
  });

  it("status has a default value", () => {
    expect(getTableColumns(workItems).status.hasDefault).toBe(true);
  });

  it("retryCount is a not-null integer with default", () => {
    const col = getTableColumns(workItems).retryCount;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it("sourceData is nullable", () => {
    expect(getTableColumns(workItems).sourceData.notNull).toBe(false);
  });

  it("processedData is nullable", () => {
    expect(getTableColumns(workItems).processedData.notNull).toBe(false);
  });

  it("processedAt is nullable", () => {
    expect(getTableColumns(workItems).processedAt.notNull).toBe(false);
  });
});
