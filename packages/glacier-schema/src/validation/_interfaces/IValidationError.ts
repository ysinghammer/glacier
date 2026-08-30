/**
 * A single validation failure produced while checking a value against a
 * `Schema`.
 */
export interface IValidationError {
  /** Location of the failing value, as path segments (not a JSON Pointer string). */
  readonly path: (string | number)[];
  /** The schema keyword that failed, e.g. "minimum", "required", "pattern". */
  readonly keyword: string;
  /** Human-readable description of the failure. */
  readonly message: string;
  /** Keyword-specific structured details, e.g. `{ limit: 18 }` for a failed `minimum`. */
  readonly params: Record<string, unknown>;
}
