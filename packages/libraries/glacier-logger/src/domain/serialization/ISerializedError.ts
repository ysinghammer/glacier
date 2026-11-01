/**
 * JSON-safe error record. Enumerable custom properties remain available, while canonical fields
 * take precedence over colliding properties.
 */
export interface ISerializedError {
  /** The error name, for example `TypeError`. */
  readonly type: string;
  /** Error message converted to a string. */
  readonly message: string;
  /** Stack text when the source error exposed a string stack. */
  readonly stack?: string;
  /** A serialised `Error`, a serialised value, or `"[Max depth]"` past the cause depth limit. */
  readonly cause?: unknown;
  /** Serialized enumerable custom properties keyed by their original property names. */
  readonly [property: string]: unknown;
}
