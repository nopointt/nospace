import { z } from "zod";
import type { SchemaField } from "./types";

export function convertToZodSchema(fields: SchemaField[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    shape[field.name] = fieldToZod(field);
  }

  return z.object(shape);
}

function fieldToZod(field: SchemaField): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  switch (field.type) {
    case "string":
      schema = z.string();
      break;
    case "number":
      schema = z.number();
      break;
    case "boolean":
      schema = z.boolean();
      break;
    case "date":
      schema = z.string(); // ISO date string
      break;
    case "enum":
      if (field.enumValues && field.enumValues.length > 0) {
        schema = z.enum(field.enumValues as [string, ...string[]]);
      } else {
        schema = z.string();
      }
      break;
    case "object":
      if (field.children && field.children.length > 0) {
        schema = convertToZodSchema(field.children);
      } else {
        schema = z.record(z.unknown());
      }
      break;
    case "array":
      if (field.children && field.children.length > 0) {
        schema = z.array(fieldToZod(field.children[0]));
      } else {
        schema = z.array(z.string());
      }
      break;
    default:
      schema = z.string();
  }

  return field.required ? schema : schema.nullable().optional();
}

export function minimalSchema(fields: SchemaField[], indent = 0): string {
  return fields
    .map((f) => {
      const prefix = "  ".repeat(indent);
      const req = f.required ? ", required" : "";
      let line = `${prefix}- ${f.name} (${f.type}${req})`;
      if (f.description) line += `: ${f.description}`;
      if (f.children && f.children.length > 0) {
        line += "\n" + minimalSchema(f.children, indent + 1);
      }
      return line;
    })
    .join("\n");
}
