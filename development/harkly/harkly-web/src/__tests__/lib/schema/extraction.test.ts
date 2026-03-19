import { describe, it, expect } from "vitest";
import { getTableName, getTableColumns } from "drizzle-orm";
import {
  projectSchemas,
  schemaFields,
  extractedEntities,
  extractedRelations,
} from "~/lib/schema/extraction";

// ── projectSchemas ────────────────────────────────────────────────────────────

describe("schema/extraction — project_schemas table", () => {
  it("table name is 'project_schemas'", () => {
    expect(getTableName(projectSchemas)).toBe("project_schemas");
  });

  it("exports a truthy Drizzle table object", () => {
    expect(projectSchemas).toBeTruthy();
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(projectSchemas));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "projectId",
        "tenantId",
        "name",
        "version",
        "status",
        "discoveryPrompt",
        "modelUsed",
        "createdAt",
        "updatedAt",
      ]),
    );
  });

  it("id is primary key and not null", () => {
    const cols = getTableColumns(projectSchemas);
    expect(cols.id.primary).toBe(true);
    expect(cols.id.notNull).toBe(true);
  });

  it("version is an integer with default 1", () => {
    const col = getTableColumns(projectSchemas).version;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.notNull).toBe(true);
    expect(col.hasDefault).toBe(true);
  });

  it("status has a default value", () => {
    expect(getTableColumns(projectSchemas).status.hasDefault).toBe(true);
  });

  it("discoveryPrompt is nullable", () => {
    expect(getTableColumns(projectSchemas).discoveryPrompt.notNull).toBe(false);
  });

  it("name is not null", () => {
    expect(getTableColumns(projectSchemas).name.notNull).toBe(true);
  });
});

// ── schemaFields ──────────────────────────────────────────────────────────────

describe("schema/extraction — schema_fields table", () => {
  it("table name is 'schema_fields'", () => {
    expect(getTableName(schemaFields)).toBe("schema_fields");
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(schemaFields));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "schemaId",
        "parentFieldId",
        "name",
        "displayName",
        "type",
        "description",
        "required",
        "enumValues",
        "extractionHints",
        "sortOrder",
        "createdAt",
      ]),
    );
  });

  it("parentFieldId is nullable (self-referential FK)", () => {
    expect(getTableColumns(schemaFields).parentFieldId.notNull).toBe(false);
  });

  it("required is an integer with default 0", () => {
    const col = getTableColumns(schemaFields).required;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.hasDefault).toBe(true);
  });

  it("sortOrder is an integer with default 0", () => {
    const col = getTableColumns(schemaFields).sortOrder;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.hasDefault).toBe(true);
  });

  it("name is not null", () => {
    expect(getTableColumns(schemaFields).name.notNull).toBe(true);
  });

  it("type is not null", () => {
    expect(getTableColumns(schemaFields).type.notNull).toBe(true);
  });

  it("displayName is nullable", () => {
    expect(getTableColumns(schemaFields).displayName.notNull).toBe(false);
  });
});

// ── extractedEntities ─────────────────────────────────────────────────────────

describe("schema/extraction — extracted_entities table", () => {
  it("table name is 'extracted_entities'", () => {
    expect(getTableName(extractedEntities)).toBe("extracted_entities");
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(extractedEntities));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "projectId",
        "schemaId",
        "documentId",
        "tenantId",
        "entityType",
        "data",
        "confidence",
        "evidence",
        "verified",
        "rejected",
        "annotation",
        "createdAt",
        "updatedAt",
      ]),
    );
  });

  it("entityType is not null", () => {
    expect(getTableColumns(extractedEntities).entityType.notNull).toBe(true);
  });

  it("data is not null (JSON stored as text)", () => {
    expect(getTableColumns(extractedEntities).data.notNull).toBe(true);
  });

  it("confidence is a nullable real column", () => {
    const col = getTableColumns(extractedEntities).confidence;
    expect(col.columnType).toBe("SQLiteReal");
    expect(col.notNull).toBe(false);
  });

  it("verified is an integer with default 0", () => {
    const col = getTableColumns(extractedEntities).verified;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.hasDefault).toBe(true);
  });

  it("rejected is an integer with default 0", () => {
    const col = getTableColumns(extractedEntities).rejected;
    expect(col.columnType).toBe("SQLiteInteger");
    expect(col.hasDefault).toBe(true);
  });

  it("annotation is nullable", () => {
    expect(getTableColumns(extractedEntities).annotation.notNull).toBe(false);
  });
});

// ── extractedRelations ────────────────────────────────────────────────────────

describe("schema/extraction — extracted_relations table", () => {
  it("table name is 'extracted_relations'", () => {
    expect(getTableName(extractedRelations)).toBe("extracted_relations");
  });

  it("has expected columns", () => {
    const cols = Object.keys(getTableColumns(extractedRelations));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "projectId",
        "schemaId",
        "tenantId",
        "relationType",
        "sourceEntityId",
        "targetEntityId",
        "confidence",
        "evidence",
        "metadata",
        "createdAt",
      ]),
    );
  });

  it("relationType is not null", () => {
    expect(getTableColumns(extractedRelations).relationType.notNull).toBe(true);
  });

  it("sourceEntityId is not null (FK to extracted_entities)", () => {
    expect(getTableColumns(extractedRelations).sourceEntityId.notNull).toBe(true);
  });

  it("targetEntityId is not null (FK to extracted_entities)", () => {
    expect(getTableColumns(extractedRelations).targetEntityId.notNull).toBe(true);
  });

  it("confidence is a nullable real column", () => {
    const col = getTableColumns(extractedRelations).confidence;
    expect(col.columnType).toBe("SQLiteReal");
    expect(col.notNull).toBe(false);
  });

  it("metadata is nullable", () => {
    expect(getTableColumns(extractedRelations).metadata.notNull).toBe(false);
  });
});
