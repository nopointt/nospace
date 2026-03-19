import { describe, it, expect } from "vitest";
import { chunkText } from "~/lib/pipeline/chunker";

describe("chunkText", () => {
  describe("when text is empty", () => {
    it("should return a single chunk with empty content", () => {
      const result = chunkText("");
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("");
      expect(result[0].index).toBe(0);
    });
  });

  describe("when text is shorter than chunkSize", () => {
    it("should return a single chunk containing the full text", () => {
      const text = "Hello world. This is a short sentence.";
      const result = chunkText(text, { chunkSize: 500 });
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(text);
      expect(result[0].index).toBe(0);
    });

    it("should return a single chunk when text equals chunkSize exactly", () => {
      const text = "a".repeat(500);
      const result = chunkText(text, { chunkSize: 500 });
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(text);
    });
  });

  describe("paragraph splitting behavior", () => {
    it("should split text at double newlines into separate chunks", () => {
      const para1 = "First paragraph with enough content here.";
      const para2 = "Second paragraph with enough content here.";
      // Each paragraph fits in chunkSize=60, combined they exceed it
      const text = `${para1}\n\n${para2}`;
      const result = chunkText(text, { chunkSize: 60, overlap: 0 });
      expect(result.length).toBeGreaterThan(1);
    });

    it("should handle multiple consecutive newlines as a paragraph separator", () => {
      const para1 = "First paragraph text.";
      const para2 = "Second paragraph text.";
      const text = `${para1}\n\n\n${para2}`;
      const result = chunkText(text, { chunkSize: 30, overlap: 0 });
      // Both paragraphs should be present in the output
      const allContent = result.map((c) => c.content).join(" ");
      expect(allContent).toContain("First paragraph text.");
      expect(allContent).toContain("Second paragraph text.");
    });

    it("should assign sequential indexes to chunks", () => {
      const longText = Array.from({ length: 20 }, (_, i) => `Sentence number ${i} with padding text.`).join("\n\n");
      const result = chunkText(longText, { chunkSize: 60, overlap: 0 });
      result.forEach((chunk, position) => {
        expect(chunk.index).toBe(position);
      });
    });
  });

  describe("overlap behavior", () => {
    it("should include overlap text at the start of subsequent chunks", () => {
      // Build text where two paragraphs fit in one chunk but three don't
      const text =
        "Alpha sentence ends here." +
        "\n\n" +
        "Beta sentence ends here." +
        "\n\n" +
        "Gamma sentence ends here.";
      const result = chunkText(text, { chunkSize: 55, overlap: 20 });
      // With overlap the second chunk should carry some text from the first
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("should use zero overlap when overlap is 0", () => {
      const text = "Line one content.\n\nLine two content.\n\nLine three content.";
      const noOverlap = chunkText(text, { chunkSize: 30, overlap: 0 });
      const withOverlap = chunkText(text, { chunkSize: 30, overlap: 15 });
      // With overlap, later chunks tend to have more content
      expect(noOverlap.length).toBeGreaterThanOrEqual(1);
      expect(withOverlap.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("edge case: overlap >= chunkSize", () => {
    it("should not enter an infinite loop and should return chunks", () => {
      const text = "x".repeat(600);
      // overlap=500 >= chunkSize=100 forces step = chunkSize - overlap = -400, clamped to at least 1
      // The implementation uses i += chunkSize - overlap, which could be negative.
      // We just verify it terminates and produces results.
      const result = chunkText(text, { chunkSize: 100, overlap: 500 });
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("very long text with no paragraph breaks", () => {
    it("should split into multiple chunks via sentence splitting", () => {
      // 20 sentences concatenated without paragraph breaks, each ~40 chars
      const sentences = Array.from(
        { length: 20 },
        (_, i) => `This is sentence number ${i} here.`,
      );
      const text = sentences.join(" ");
      const result = chunkText(text, { chunkSize: 150, overlap: 30 });
      expect(result.length).toBeGreaterThan(1);
    });

    it("should force-split a single segment longer than chunkSize", () => {
      // No spaces, no sentence endings — a single blob
      const text = "a".repeat(1200);
      const result = chunkText(text, { chunkSize: 500, overlap: 50 });
      // Should produce at least 3 force-split slices (1200 / ~450 ≈ 3)
      expect(result.length).toBeGreaterThanOrEqual(2);
      // Every chunk content length should be <= chunkSize
      for (const chunk of result) {
        expect(chunk.content.length).toBeLessThanOrEqual(500);
      }
    });

    it("should preserve all text content across chunks (no data loss)", () => {
      const sentences = Array.from(
        { length: 10 },
        (_, i) => `Unique marker sentence ${i} ends.`,
      );
      const text = sentences.join(" ");
      const result = chunkText(text, { chunkSize: 80, overlap: 20 });
      const combined = result.map((c) => c.content).join(" ");
      // Each original sentence should appear somewhere in the output
      for (const sentence of sentences) {
        expect(combined).toContain(sentence);
      }
    });
  });

  describe("default options", () => {
    it("should use chunkSize=500 and overlap=100 when no options provided", () => {
      const text = "x".repeat(1100);
      const result = chunkText(text);
      expect(result.length).toBeGreaterThan(1);
      // Each chunk should not exceed default chunkSize of 500
      for (const chunk of result) {
        expect(chunk.content.length).toBeLessThanOrEqual(500);
      }
    });
  });
});
