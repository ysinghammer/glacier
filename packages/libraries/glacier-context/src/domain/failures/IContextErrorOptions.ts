/** Options shared by every context error; the cause is preserved unchanged when supplied. */
export interface IContextErrorOptions {
  /** The underlying failure being wrapped, kept observable through `Error.cause`. */
  readonly cause?: unknown;
}
