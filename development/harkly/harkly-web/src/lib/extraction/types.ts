export interface SchemaField {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "array" | "object" | "enum";
  description?: string;
  required?: boolean;
  children?: SchemaField[];
  enumValues?: string[];
  extractionHints?: string;
}
