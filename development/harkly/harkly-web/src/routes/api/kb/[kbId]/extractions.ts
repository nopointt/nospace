import type { APIEvent } from "@solidjs/start/server";
import { getBindings, createKbDb } from "~/lib/db";
import { requireAuth } from "~/lib/auth-guard";
import { extractedEntities } from "~/lib/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/kb/[kbId]/extractions — list extracted entities
export async function GET(event: APIEvent) {
  try {
    const tenantId = await requireAuth(event);
    const env = getBindings(event);
    const db = createKbDb(env.KB_DB);
  const { kbId } = event.params;

  const url = new URL(event.request.url);
  const schemaId = url.searchParams.get("schemaId");
  const format = url.searchParams.get("format"); // "csv" for export

  const conditions = [
    eq(extractedEntities.projectId, kbId),
    eq(extractedEntities.tenantId, tenantId),
  ];
  if (schemaId) {
    conditions.push(eq(extractedEntities.schemaId, schemaId));
  }

  const rows = await db
    .select()
    .from(extractedEntities)
    .where(and(...conditions))
    .orderBy(desc(extractedEntities.createdAt))
    .all();

  // CSV export
  if (format === "csv") {
    if (rows.length === 0) {
      return new Response("No data", { status: 404 });
    }

    // Parse data JSON to get columns
    const allData = rows.map((r) => {
      try {
        return JSON.parse(r.data);
      } catch {
        return {};
      }
    });

    const columns = [...new Set(allData.flatMap((d) => Object.keys(d)))];
    const header = ["id", "confidence", ...columns].join(",");
    const csvRows = rows.map((r, i) => {
      const data = allData[i];
      const values = [
        r.id,
        r.confidence?.toString() ?? "",
        ...columns.map((col) => {
          const val = data[col];
          if (val === null || val === undefined) return "";
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }),
      ];
      return values.join(",");
    });

    const csv = [header, ...csvRows].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=extraction.csv",
      },
    });
  }

  return Response.json({ data: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
