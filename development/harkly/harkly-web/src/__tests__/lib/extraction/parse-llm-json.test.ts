import { describe, it, expect } from "vitest";
import { parseLlmJson } from "~/lib/extraction/parse-llm-json";

describe("parseLlmJson", () => {
  describe("clean JSON input", () => {
    it("should parse a plain JSON object string directly", () => {
      const result = parseLlmJson<{ name: string }>('{"name":"Alice"}');
      expect(result).toEqual({ name: "Alice" });
    });

    it("should parse a plain JSON array string directly", () => {
      const result = parseLlmJson<number[]>("[1,2,3]");
      expect(result).toEqual([1, 2, 3]);
    });

    it("should parse a nested JSON object", () => {
      const raw = '{"person":{"name":"Bob","age":30},"active":true}';
      const result = parseLlmJson<{ person: { name: string; age: number }; active: boolean }>(raw);
      expect(result).toEqual({ person: { name: "Bob", age: 30 }, active: true });
    });

    it("should parse a JSON object with numeric and boolean values", () => {
      const raw = '{"count":42,"flag":false,"ratio":3.14}';
      const result = parseLlmJson<{ count: number; flag: boolean; ratio: number }>(raw);
      expect(result.count).toBe(42);
      expect(result.flag).toBe(false);
      expect(result.ratio).toBeCloseTo(3.14);
    });
  });

  describe("JSON wrapped in markdown fences", () => {
    it("should strip ```json fence and parse the object", () => {
      const raw = "```json\n{\"key\":\"value\"}\n```";
      const result = parseLlmJson<{ key: string }>(raw);
      expect(result).toEqual({ key: "value" });
    });

    it("should strip plain ``` fence and parse the object", () => {
      const raw = "```\n{\"x\":1}\n```";
      const result = parseLlmJson<{ x: number }>(raw);
      expect(result).toEqual({ x: 1 });
    });

    it("should handle multiple backtick blocks (strips all occurrences)", () => {
      const raw = "```json\n{\"a\":1}\n```\n```\n{\"b\":2}\n```";
      // After stripping all fences: '{"a":1}\n{"b":2}' — not valid JSON as a whole.
      // The function will attempt direct parse, fail, then use brace-balancing on first '{'.
      const result = parseLlmJson<{ a: number }>(raw);
      expect(result.a).toBe(1);
    });
  });

  describe("JSON with surrounding text", () => {
    it("should extract JSON object embedded in prose using brace-balancing", () => {
      const raw = 'The answer is: {"score": 95, "label": "high"} as determined.';
      const result = parseLlmJson<{ score: number; label: string }>(raw);
      expect(result).toEqual({ score: 95, label: "high" });
    });

    it("should extract JSON array embedded in prose", () => {
      const raw = 'Here are the items: [10, 20, 30] from the document.';
      const result = parseLlmJson<number[]>(raw);
      expect(result).toEqual([10, 20, 30]);
    });

    it("should extract JSON when preceded by a markdown header", () => {
      const raw = "## Result\n\n{\"status\":\"ok\",\"count\":5}";
      const result = parseLlmJson<{ status: string; count: number }>(raw);
      expect(result).toEqual({ status: "ok", count: 5 });
    });

    it("should handle leading whitespace and newlines before JSON", () => {
      const raw = "\n\n  \n{\"value\":99}";
      const result = parseLlmJson<{ value: number }>(raw);
      expect(result).toEqual({ value: 99 });
    });
  });

  describe("brace-balancing fallback", () => {
    it("should extract the first balanced object when there is trailing garbage", () => {
      const raw = '{"a":1} trailing garbage that is not JSON';
      const result = parseLlmJson<{ a: number }>(raw);
      expect(result).toEqual({ a: 1 });
    });

    it("should handle nested braces correctly in brace-balancing", () => {
      const raw = 'prefix {"outer":{"inner":42}} suffix';
      const result = parseLlmJson<{ outer: { inner: number } }>(raw);
      expect(result).toEqual({ outer: { inner: 42 } });
    });

    it("should extract an object with array values via brace-balancing", () => {
      const raw = 'Result: {"items":[1,2,3],"ok":true} done.';
      const result = parseLlmJson<{ items: number[]; ok: boolean }>(raw);
      expect(result).toEqual({ items: [1, 2, 3], ok: true });
    });

    it("should prefer { over [ when both are present and { comes first", () => {
      const raw = 'Some text {"key":"val"} and [1,2,3] after';
      const result = parseLlmJson<{ key: string }>(raw);
      expect(result).toEqual({ key: "val" });
    });

    it("should fall back to [ when no { is present", () => {
      const raw = 'Result is [4,5,6] here';
      const result = parseLlmJson<number[]>(raw);
      expect(result).toEqual([4, 5, 6]);
    });
  });

  describe("malformed JSON handling", () => {
    it("should throw when there is no JSON structure at all", () => {
      expect(() => parseLlmJson("just plain text with no brackets")).toThrow(
        /No JSON found in LLM response/,
      );
    });

    it("should throw when braces are unbalanced (unclosed object)", () => {
      expect(() => parseLlmJson('prefix {"key": "value" and no closing')).toThrow(
        /Unbalanced JSON|JSON/,
      );
    });

    it("should throw when the extracted balanced JSON is still malformed", () => {
      // '{' and '}' are balanced but content is not valid JSON
      expect(() => parseLlmJson("{key without quotes: value}")).toThrow();
    });

    it("should throw when input is an empty string", () => {
      expect(() => parseLlmJson("")).toThrow();
    });

    it("should throw for a lone markdown fence with no JSON", () => {
      expect(() => parseLlmJson("```json\n\n```")).toThrow();
    });
  });

  describe("type parameter forwarding", () => {
    it("should return the correct TypeScript type via the generic parameter", () => {
      interface Person { name: string; age: number }
      const result = parseLlmJson<Person>('{"name":"Charlie","age":25}');
      // TypeScript type is structural — just verify the shape
      expect(result.name).toBe("Charlie");
      expect(result.age).toBe(25);
    });
  });
});
