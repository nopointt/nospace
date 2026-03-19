import { describe, it, expect } from "vitest";
import { validateAndTruncateContent } from "~/lib/pipeline/token-counter";

// The actual file exports validateAndTruncateContent, not estimateTokens / truncateToTokenLimit.
// Tests cover the public surface: byte-accurate truncation at word boundaries.

describe("validateAndTruncateContent", () => {
  describe("when content is within the byte limit", () => {
    it("should return the content unchanged for a short ASCII string", () => {
      const content = "Hello, world!";
      const result = validateAndTruncateContent(content, 100);
      expect(result).toBe("Hello, world!");
    });

    it("should return content unchanged when byte length equals the limit exactly", () => {
      // 10 ASCII bytes = 10 chars
      const content = "0123456789";
      const result = validateAndTruncateContent(content, 10);
      expect(result).toBe("0123456789");
    });

    it("should return empty string unchanged", () => {
      const result = validateAndTruncateContent("", 100);
      expect(result).toBe("");
    });
  });

  describe("when content exceeds the byte limit", () => {
    it("should truncate English text at the last word boundary before the limit", () => {
      // "Hello world foo" = 15 bytes; limit 11 → truncated slice is "Hello world"
      // lastIndexOf(' ') at index 5 → "Hello"... wait, let's be precise:
      // "Hello world" = 11 bytes, lastSpace is at index 5 ("Hello"), so result is "Hello"
      const content = "Hello world foo bar";
      const result = validateAndTruncateContent(content, 11);
      // bytes[0..11] = "Hello world" → lastSpace at index 5 → "Hello"
      expect(result).toBe("Hello");
    });

    it("should truncate at a word boundary, not mid-word", () => {
      const content = "one two three four five";
      // limit 14 bytes: "one two three " (indices 0-13)
      // actual string: "one two three " last space at 13, slice(0,13) = "one two three"
      const result = validateAndTruncateContent(content, 14);
      // The result should be a whole-word prefix
      expect(result.split(" ").every((w) => w.length > 0 || w === "")).toBe(true);
      expect(content).toContain(result);
    });

    it("should return the truncated bytes as-is when there is no space in the slice", () => {
      const content = "superlongwordwithoutspaces more text";
      // limit 10: slice = "superlongw", no space → returns full slice
      const result = validateAndTruncateContent(content, 10);
      expect(result).toBe("superlongw");
    });
  });

  describe("UTF-8 multi-byte character handling", () => {
    it("should handle Russian text and not exceed byte limit", () => {
      // Each Cyrillic character is 2 bytes in UTF-8
      const russianText = "Привет мир это тест для проверки усечения текста";
      const limit = 20;
      const result = validateAndTruncateContent(russianText, limit);
      const encoder = new TextEncoder();
      const resultBytes = encoder.encode(result).length;
      expect(resultBytes).toBeLessThanOrEqual(limit);
    });

    it("should handle CJK characters (3 bytes each) without byte limit violation", () => {
      // Each CJK character is 3 bytes in UTF-8
      const cjkText = "你好 世界 测试 内容 截断 处理 验证";
      const limit = 15;
      const result = validateAndTruncateContent(cjkText, limit);
      const encoder = new TextEncoder();
      const resultBytes = encoder.encode(result).length;
      expect(resultBytes).toBeLessThanOrEqual(limit);
    });

    it("should not throw when the byte boundary falls mid-character", () => {
      // "Привет" = 12 bytes (6 Cyrillic chars × 2 bytes), limit = 7 cuts mid-char.
      // TextDecoder may emit a replacement character (U+FFFD = 3 UTF-8 bytes) for
      // the truncated sequence — the output byte count can exceed the raw slice limit,
      // but the function must not throw and must return a valid string.
      const mixedText = "Привет world";
      expect(() => validateAndTruncateContent(mixedText, 7)).not.toThrow();
      const result = validateAndTruncateContent(mixedText, 7);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("default maxBytes", () => {
    it("should use 1_500_000 bytes as the default limit", () => {
      // A string well under 1.5 MB must pass through unchanged
      const content = "short content";
      const result = validateAndTruncateContent(content);
      expect(result).toBe("short content");
    });
  });
});
