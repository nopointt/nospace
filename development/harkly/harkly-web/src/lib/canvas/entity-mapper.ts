/**
 * Entity-to-Frame mapper for canvas auto-layout.
 * Maps D1 entities (sources, schemas, extractions) to FrameData positions.
 */

import { WINDOW_DEFAULT_WIDTH, WINDOW_DEFAULT_HEIGHT } from "./constants";

interface SourceRow {
  id: string;
  title?: string | null;
  type: string;
  status: string;
  mimeType?: string | null;
}

interface SchemaRow {
  id: string;
  name: string;
  status: string;
}

interface EntityRow {
  id: string;
  entityType: string;
  data: string;
  schemaId: string;
}

interface MappedFrame {
  id: string;
  module: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floor: number;
  frameData: string | null;
}

interface MapInput {
  sources: SourceRow[];
  schemas: SchemaRow[];
  entities: EntityRow[];
}

const COLUMN_COUNT = 3;
const GAP = 20;
const FRAME_W = WINDOW_DEFAULT_WIDTH;
const FRAME_H = WINDOW_DEFAULT_HEIGHT;
const START_X = 40;
const START_Y = 40;

function gridPosition(index: number): { x: number; y: number } {
  const col = index % COLUMN_COUNT;
  const row = Math.floor(index / COLUMN_COUNT);
  return {
    x: START_X + col * (FRAME_W + GAP),
    y: START_Y + row * (FRAME_H + GAP),
  };
}

/**
 * Generate frame layout from extracted data.
 * - Sources -> SourceCard frames (floor 2 / Raw Data)
 * - Schemas -> Panel frames (floor 0 / Framing)
 * - Extracted entities -> Insights frames (floor 3 / Insights)
 */
export function mapEntitiesToFrames(input: MapInput): MappedFrame[] {
  const frames: MappedFrame[] = [];
  let sourceIdx = 0;
  let schemaIdx = 0;
  let entityIdx = 0;

  // Map sources to SourceCard frames on floor 2 (Raw Data)
  for (const source of input.sources) {
    const pos = gridPosition(sourceIdx);
    frames.push({
      id: `source-${source.id}`,
      module: "source-card",
      title: source.title || source.type,
      x: pos.x,
      y: pos.y,
      width: FRAME_W,
      height: 200,
      floor: 2,
      frameData: JSON.stringify({
        sourceId: source.id,
        status: source.status,
        mimeType: source.mimeType,
      }),
    });
    sourceIdx++;
  }

  // Map schemas to Panel frames on floor 0 (Framing)
  for (const schema of input.schemas) {
    const pos = gridPosition(schemaIdx);
    frames.push({
      id: `schema-${schema.id}`,
      module: "panel",
      title: schema.name,
      x: pos.x,
      y: pos.y,
      width: FRAME_W,
      height: FRAME_H,
      floor: 0,
      frameData: JSON.stringify({
        schemaId: schema.id,
        status: schema.status,
      }),
    });
    schemaIdx++;
  }

  // Map extracted entities to Insights frames on floor 3 (Insights)
  // Group entities by schema for a cleaner layout
  const entitiesBySchema = new Map<string, EntityRow[]>();
  for (const entity of input.entities) {
    const existing = entitiesBySchema.get(entity.schemaId) ?? [];
    entitiesBySchema.set(entity.schemaId, [...existing, entity]);
  }

  for (const [schemaId, schemaEntities] of entitiesBySchema) {
    const pos = gridPosition(entityIdx);
    frames.push({
      id: `insights-${schemaId}`,
      module: "insights",
      title: `${schemaEntities[0]?.entityType ?? "Данные"} (${schemaEntities.length})`,
      x: pos.x,
      y: pos.y,
      width: FRAME_W,
      height: FRAME_H,
      floor: 3,
      frameData: JSON.stringify({
        schemaId,
        entityCount: schemaEntities.length,
        entityIds: schemaEntities.map((e) => e.id),
      }),
    });
    entityIdx++;
  }

  return frames;
}
