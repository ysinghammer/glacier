import type { IContextErrorOptions } from "./IContextErrorOptions.js";

/**
 * Base class of every exceptional context failure, letting callers catch all of them at once.
 * The subclass name becomes `name`, and an optional cause is preserved through `Error.cause`.
 */
export class ContextError extends Error {
  /** Creates the error; `options.cause` wraps an underlying failure without replacing it. */
  public constructor(message: string, options?: IContextErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
