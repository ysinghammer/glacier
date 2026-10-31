import type { IJsonSchemaDirection } from "./IJsonSchemaDirection.js";

/** Explicit wire context for bounded metadata-only schema compatibility checks. Output is JSON without coercion. */
export interface IJsonSchemaCompatibilityOptions {
  readonly direction: IJsonSchemaDirection;
  readonly wire: "json" | "text";
  readonly coerce: boolean;
}
