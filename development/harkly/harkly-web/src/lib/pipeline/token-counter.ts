const D1_SAFE_CONTENT_SIZE = 1_500_000; // 1.5MB safe for D1

export function validateAndTruncateContent(
  content: string,
  maxBytes: number = D1_SAFE_CONTENT_SIZE,
): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);

  if (bytes.length <= maxBytes) {
    return content;
  }

  // Truncate at last complete word before limit
  const truncated = new TextDecoder().decode(bytes.slice(0, maxBytes));
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
}
