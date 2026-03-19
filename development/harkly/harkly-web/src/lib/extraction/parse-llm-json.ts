export function parseLlmJson<T = any>(raw: string): T {
  // Strip markdown fences
  let cleaned = raw
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // Scan for first balanced { or [
    const startChar = cleaned.includes("{") ? "{" : "[";
    const endChar = startChar === "{" ? "}" : "]";
    const startIdx = cleaned.indexOf(startChar);
    if (startIdx === -1) {
      throw new Error(`No JSON found in LLM response: ${cleaned.substring(0, 200)}`);
    }

    let depth = 0;
    for (let i = startIdx; i < cleaned.length; i++) {
      if (cleaned[i] === startChar) depth++;
      if (cleaned[i] === endChar) depth--;
      if (depth === 0) {
        return JSON.parse(cleaned.substring(startIdx, i + 1));
      }
    }

    throw new Error(`Unbalanced JSON in LLM response: ${cleaned.substring(0, 200)}`);
  }
}
