/**
 * Plain, JSON-safe form of an `Error`. Own enumerable properties of the error appear as extra
 * keys; the canonical fields below always win over a colliding property.
 */
export interface ISerializedError {
  /** The error name, for example `TypeError`. */
  readonly type: string;
  readonly message: string;
  readonly stack?: string;
  /** A serialised `Error`, a serialised value, or `"[Max depth]"` past the cause depth limit. */
  readonly cause?: unknown;
  readonly [property: string]: unknown;
}
