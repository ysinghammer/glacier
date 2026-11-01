import type { IJsonSchemaDirection } from "./IJsonSchemaDirection.js";

/** Explicit wire context for bounded metadata-only schema compatibility checks. Output is JSON without coercion. */
export interface IJsonSchemaCompatibilityOptions {
  /** Input schema or projected output schema being checked. */
  readonly direction: IJsonSchemaDirection;
  /** Wire representation whose supported input values are checked. */
  readonly wire: "json" | "text";
  /** Whether ordinary scalar coercions are available in the input contract. */
  readonly coerce: boolean;
}
