import { ulid } from "ulid";

export function generateId(): string {
  return ulid();
}

// Strip non-alphanumeric chars except hyphens for Vectorize ID safety
export function ensureSafeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-]/g, "");
}
