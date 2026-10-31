/** Options shared by every container error; the cause is preserved unchanged when supplied. */
export interface IContainerErrorOptions {
  /** The underlying failure being wrapped, kept observable through `Error.cause`. */
  readonly cause?: unknown;
}
