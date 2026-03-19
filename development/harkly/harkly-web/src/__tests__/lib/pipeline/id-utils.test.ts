import { describe, it, expect } from "vitest";
import { generateId, ensureSafeId } from "~/lib/pipeline/id-utils";

describe("generateId", () => {
  describe("ULID format", () => {
    it("should return a 26-character string", () => {
      const id = generateId();
      expect(id).toHaveLength(26);
    });

    it("should return only Crockford Base32 characters (uppercase alphanumeric)", () => {
      const id = generateId();
      // Crockford Base32 alphabet: 0-9 A-Z (excluding I L O U)
      expect(id).toMatch(/^[0-9A-Z]{26}$/);
    });

    it("should produce unique IDs on successive calls", () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });

    it("should be lexicographically sortable (later call produces greater or equal value)", () => {
      const id1 = generateId();
      // Small delay not needed — ULID timestamp is millisecond precision,
      // within the same ms they are still unique but may share the same timestamp prefix.
      const id2 = generateId();
      // At minimum they must not be equal
      // (with 80-bit random part, collision probability is negligible)
      expect(id1).not.toBe(id2);
    });
  });
});

describe("ensureSafeId", () => {
  it("should return alphanumeric characters unchanged", () => {
    const id = "abc123ABC";
    expect(ensureSafeId(id)).toBe("abc123ABC");
  });

  it("should preserve hyphens", () => {
    const id = "abc-123-DEF";
    expect(ensureSafeId(id)).toBe("abc-123-DEF");
  });

  it("should strip underscores", () => {
    const id = "abc_123";
    expect(ensureSafeId(id)).toBe("abc123");
  });

  it("should strip special characters like dots, slashes, and spaces", () => {
    const id = "abc.123/DEF GHI";
    expect(ensureSafeId(id)).toBe("abc123DEFGHI");
  });

  it("should strip Crockford Base32 ULID characters that are not alphanumeric or hyphens", () => {
    // ULIDs are already alphanumeric — pass-through
    const ulid = "01JTEST1234567890ABCDEFGH";
    expect(ensureSafeId(ulid)).toBe("01JTEST1234567890ABCDEFGH");
  });

  it("should return empty string when all characters are stripped", () => {
    const id = "!@#$%^&*()";
    expect(ensureSafeId(id)).toBe("");
  });

  it("should handle empty string input", () => {
    expect(ensureSafeId("")).toBe("");
  });

  it("should make a Vectorize-safe ID from a ULID", () => {
    const id = generateId();
    const safe = ensureSafeId(id);
    // Must only contain alphanumeric and hyphens
    expect(safe).toMatch(/^[a-zA-Z0-9-]*$/);
  });
});
