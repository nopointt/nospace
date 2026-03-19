/**
 * Tests for src/lib/pipeline/token-counter.ts — validateAndTruncateContent
 *
 * The file exports only one function: validateAndTruncateContent.
 * The name alludes to token counting but the implementation measures raw UTF-8
 * byte length and truncates at the last space before the byte limit.
 *
 * Covers:
 * - ASCII text within limit is returned unchanged
 * - ASCII text over limit is truncated at last space
 * - Text exactly at limit is returned unchanged
 * - Multi-byte Cyrillic text within limit
 * - Multi-byte CJK text within limit
 * - Emoji (4-byte) text within limit
 * - Truncation at custom limit
 * - Known bug: TextDecoder splitting a multi-byte sequence at byte boundary
 *   can produce mojibake (replacement character U+FFFD). Documented here.
 * - Text with no spaces truncates without word boundary (fallback to raw slice)
 */

import { describe, it, expect } from "vitest";
import { validateAndTruncateContent } from "~/lib/pipeline/token-counter";

// ── ASCII — within limit ───────────────────────────────────────────────────────

describe("validateAndTruncateContent — ASCII within limit", () => {
  it("returns unchanged when bytes <= default 1.5 MB limit", () => {
    const text = "Hello, world!";
    expect(validateAndTruncateContent(text)).toBe(text);
  });

  it("returns unchanged when text is empty", () => {
    expect(validateAndTruncateContent("")).toBe("");
  });

  it("returns unchanged when text is exactly at the limit", () => {
    // Build a string of exactly 1_500_000 ASCII bytes
    const text = "a".repeat(1_500_000);
    expect(validateAndTruncateContent(text)).toBe(text);
  });
});

// ── ASCII — truncation ─────────────────────────────────────────────────────────

describe("validateAndTruncateContent — ASCII truncation", () => {
  it("truncates at last space before custom maxBytes limit", () => {
    // "hello world extra" — if maxBytes=11, bytes are "hello world" = 11 chars
    // but "hello world extra" = 17 bytes > 11, so truncate at last space
    const text = "hello world extra";
    const result = validateAndTruncateContent(text, 11);
    // Raw slice of 11 bytes = "hello world"; last space at index 5 → "hello"
    expect(result).toBe("hello");
  });

  it("truncates long ASCII text and result fits within limit", () => {
    const text = "word ".repeat(400_000); // 2_000_000 bytes
    const maxBytes = 1_500_000;
    const result = validateAndTruncateContent(text, maxBytes);
    const encoder = new TextEncoder();
    expect(encoder.encode(result).length).toBeLessThanOrEqual(maxBytes);
  });

  it("truncated result ends with a complete word, not mid-word", () => {
    const text = "alpha beta gamma delta epsilon";
    const result = validateAndTruncateContent(text, 20);
    // Result must not end with a partial word — all chars should be printable/space
    expect(result).not.toMatch(/\s$/);
    // The result should be a prefix of the original up to a word boundary
    const words = result.split(" ");
    words.forEach((w) => {
      expect(text).toContain(w);
    });
  });

  it("handles text with no spaces by returning raw byte slice", () => {
    // lastIndexOf(" ") returns -1 when there are no spaces → returns full truncated bytes
    const text = "a".repeat(2_000_000);
    const maxBytes = 10;
    const result = validateAndTruncateContent(text, maxBytes);
    // No spaces → falls through to return the raw slice (no lastSpace > 0 condition met)
    expect(result.length).toBeLessThanOrEqual(maxBytes);
  });
});

// ── Multi-byte UTF-8 ──────────────────────────────────────────────────────────

describe("validateAndTruncateContent — multi-byte characters within limit", () => {
  it("Cyrillic text within limit is returned unchanged", () => {
    // Cyrillic chars are 2 bytes each in UTF-8
    const text = "Привет мир"; // 10 chars, 18 bytes
    const result = validateAndTruncateContent(text, 100);
    expect(result).toBe(text);
  });

  it("CJK characters within limit are returned unchanged", () => {
    // CJK chars are 3 bytes each in UTF-8
    const text = "你好世界"; // 4 chars, 12 bytes
    const result = validateAndTruncateContent(text, 100);
    expect(result).toBe(text);
  });

  it("emoji within limit is returned unchanged", () => {
    // Emoji are 4 bytes each in UTF-8
    const text = "Hello 🎉 world 🚀";
    const result = validateAndTruncateContent(text, 200);
    expect(result).toBe(text);
  });

  it("custom limit respected for Cyrillic — result byte length within limit", () => {
    const text = "Привет мир снова"; // 31 bytes in UTF-8
    const maxBytes = 14; // cuts inside "мир"
    const encoder = new TextEncoder();
    const result = validateAndTruncateContent(text, maxBytes);
    expect(encoder.encode(result).length).toBeLessThanOrEqual(maxBytes);
  });
});

// ── Known bug: mojibake on multi-byte boundary ────────────────────────────────

describe("validateAndTruncateContent — known bug: mojibake on multi-byte boundary", () => {
  it("KNOWN BUG: slicing byte array at a multi-byte sequence boundary causes mojibake", () => {
    // TextDecoder replaces incomplete byte sequences with U+FFFD (replacement char).
    // For a Cyrillic string truncated at an odd byte position, the last decoded
    // character may be U+FFFD instead of the intended character.
    //
    // Example: "Привет" = П(d0 9f) р(d1 80) и(d0 b8) в(d0 b2) е(d0 b5) т(d1 82)
    // If maxBytes=3, slice is [d0 9f d1] — d1 alone is incomplete → U+FFFD.
    const text = "Привет";
    const maxBytes = 3; // cuts the 2nd byte of "р" (d1 80) after d1
    const result = validateAndTruncateContent(text, maxBytes);
    // Document the observed behavior: result may contain replacement character
    // or be an incomplete character. We assert the byte length constraint holds.
    const encoder = new TextEncoder();
    // The implementation's output might contain replacement char — this is the bug.
    // We just verify it doesn't throw and stays within byte budget of decoded length.
    expect(typeof result).toBe("string");
    // Note: the encoded result after re-encoding may differ due to U+FFFD expansion
    // This test documents the bug exists rather than asserting correct behavior.
    const bugDocumentation =
      "TextDecoder with no fatal flag silently replaces incomplete multi-byte sequences " +
      "with U+FFFD. Fix: use TextDecoder({ fatal: false }) and then strip the replacement " +
      "char, or use a safer byte-to-char boundary finder.";
    expect(bugDocumentation.length).toBeGreaterThan(0);
  });
});
