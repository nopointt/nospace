import { describe, it, expect, vi, beforeEach } from "vitest";

// ── External library mocks (must be declared before importing the module) ──────

vi.mock("unpdf", () => ({
  extractText: vi.fn(),
}));

vi.mock("mammoth", () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

vi.mock("xlsx", () => ({
  default: {
    read: vi.fn(),
    utils: {
      sheet_to_csv: vi.fn(),
    },
  },
}));

import { extractText } from "~/lib/pipeline/text-extractor";
import { extractText as extractPdfText } from "unpdf";
import mammoth from "mammoth";
import XLSX from "xlsx";

// ── Helpers ──────────────────────────────────────────────────────────────────

function createMockR2Object(content: string | ArrayBuffer): R2ObjectBody {
  const isString = typeof content === "string";
  return {
    text: vi.fn().mockResolvedValue(isString ? content : ""),
    arrayBuffer: vi.fn().mockResolvedValue(
      isString ? new TextEncoder().encode(content).buffer : content,
    ),
    json: vi.fn(),
    blob: vi.fn(),
    body: null,
    bodyUsed: false,
  } as unknown as R2ObjectBody;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("extractText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("text/plain", () => {
    it("should return text directly from r2Object.text()", async () => {
      const r2 = createMockR2Object("Plain text content");
      const result = await extractText(r2, "text/plain");
      expect(result).toBe("Plain text content");
    });
  });

  describe("text/markdown", () => {
    it("should return markdown content directly from r2Object.text()", async () => {
      const markdown = "# Heading\n\nSome **bold** text.";
      const r2 = createMockR2Object(markdown);
      const result = await extractText(r2, "text/markdown");
      expect(result).toBe(markdown);
    });
  });

  describe("application/json", () => {
    it("should parse and pretty-print JSON content", async () => {
      const raw = '{"key":"value","num":42}';
      const r2 = createMockR2Object(raw);
      const result = await extractText(r2, "application/json");
      expect(result).toBe(JSON.stringify({ key: "value", num: 42 }, null, 2));
    });

    it("should throw when JSON content is malformed", async () => {
      const r2 = createMockR2Object("{bad json");
      await expect(extractText(r2, "application/json")).rejects.toThrow();
    });
  });

  describe("application/pdf", () => {
    it("should call extractPdfText with the array buffer and return extracted text", async () => {
      vi.mocked(extractPdfText).mockResolvedValue({ text: "PDF extracted text" } as any);
      const r2 = createMockR2Object("ignored — uses arrayBuffer");
      const result = await extractText(r2, "application/pdf");
      expect(extractPdfText).toHaveBeenCalledOnce();
      expect(result).toBe("PDF extracted text");
    });
  });

  describe("application/vnd.openxmlformats-officedocument.wordprocessingml.document (docx)", () => {
    it("should call mammoth.extractRawText with the array buffer", async () => {
      vi.mocked(mammoth.extractRawText).mockResolvedValue({ value: "Word document text", messages: [] });
      const r2 = createMockR2Object("ignored");
      const result = await extractText(
        r2,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      expect(mammoth.extractRawText).toHaveBeenCalledOnce();
      expect(result).toBe("Word document text");
    });
  });

  describe("text/csv and xlsx", () => {
    const mockWorkbook = {
      SheetNames: ["Sheet1", "Sheet2"],
      Sheets: {
        Sheet1: {},
        Sheet2: {},
      },
    };

    beforeEach(() => {
      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
      vi.mocked(XLSX.utils.sheet_to_csv)
        .mockReturnValueOnce("col1,col2\nval1,val2")
        .mockReturnValueOnce("a,b\n1,2");
    });

    it("should combine all sheets into a single string for text/csv", async () => {
      const r2 = createMockR2Object("ignored");
      const result = await extractText(r2, "text/csv");
      expect(result).toContain("--- Sheet1 ---");
      expect(result).toContain("col1,col2\nval1,val2");
      expect(result).toContain("--- Sheet2 ---");
      expect(result).toContain("a,b\n1,2");
    });

    it("should combine all sheets for xlsx MIME type", async () => {
      vi.mocked(XLSX.utils.sheet_to_csv)
        .mockReturnValueOnce("x,y\n1,2")
        .mockReturnValueOnce("p,q\n3,4");
      const r2 = createMockR2Object("ignored");
      const result = await extractText(
        r2,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      expect(result).toContain("--- Sheet1 ---");
      expect(result).toContain("--- Sheet2 ---");
    });
  });

  describe("unsupported MIME type", () => {
    it("should throw an error with the unsupported MIME type in the message", async () => {
      const r2 = createMockR2Object("some content");
      await expect(extractText(r2, "image/png")).rejects.toThrow(
        "Unsupported MIME type: image/png",
      );
    });

    it("should throw for audio/mpeg MIME type", async () => {
      const r2 = createMockR2Object("binary");
      await expect(extractText(r2, "audio/mpeg")).rejects.toThrow(
        "Unsupported MIME type: audio/mpeg",
      );
    });
  });

  describe("empty file handling", () => {
    it("should return empty string for empty text/plain file", async () => {
      const r2 = createMockR2Object("");
      const result = await extractText(r2, "text/plain");
      expect(result).toBe("");
    });

    it("should return empty string for empty text/markdown file", async () => {
      const r2 = createMockR2Object("");
      const result = await extractText(r2, "text/markdown");
      expect(result).toBe("");
    });

    it("should handle empty pdf result gracefully", async () => {
      vi.mocked(extractPdfText).mockResolvedValue({ text: "" } as any);
      const r2 = createMockR2Object("");
      const result = await extractText(r2, "application/pdf");
      expect(result).toBe("");
    });
  });
});
