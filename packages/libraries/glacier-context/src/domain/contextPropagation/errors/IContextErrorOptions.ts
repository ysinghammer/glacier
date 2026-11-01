/** Optional metadata accepted by context errors to preserve an underlying cause. */
export interface IContextErrorOptions {
  /** Optional underlying failure, preserved unchanged as `Error.cause` when provided; readonly after creation. */
  readonly cause?: unknown;
}
