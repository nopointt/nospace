import { extractText as extractPdfText } from "unpdf";
import mammoth from "mammoth";
import XLSX from "xlsx";

export async function extractText(
  r2Object: R2ObjectBody,
  mimeType: string,
): Promise<string> {
  switch (mimeType) {
    case "application/pdf": {
      const buffer = await r2Object.arrayBuffer();
      const result = await extractPdfText({ data: new Uint8Array(buffer) });
      return result.text;
    }

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const buffer = await r2Object.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    }

    case "text/csv":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      const buffer = await r2Object.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheets = workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name];
        return `--- ${name} ---\n${XLSX.utils.sheet_to_csv(sheet)}`;
      });
      return sheets.join("\n\n");
    }

    case "text/plain":
    case "text/markdown":
      return await r2Object.text();

    case "application/json": {
      const raw = await r2Object.text();
      return JSON.stringify(JSON.parse(raw), null, 2);
    }

    default:
      throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
}
