import { ContextError } from "./ContextError.error.js";
import type { IContextErrorOptions } from "./IContextErrorOptions.js";

/** Raised when one `GlacierContext.run` call receives the same key more than once. */
export class DuplicateContextKeyError extends ContextError {
  /** Creates the error for the key that appeared repeatedly in a single entry list. */
  public constructor(keyDescription: string, options?: IContextErrorOptions) {
    super(`The key "${keyDescription}" was given more than once to a single run`, options);
  }
}
