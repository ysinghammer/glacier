import { ContextError } from "./ContextError.error.js";
import type { IContextErrorOptions } from "./IContextErrorOptions.js";

/** Raised when the active context holds no value for the requested key. */
export class ContextValueMissingError extends ContextError {
  /** Creates the error for the key that no enclosing `run` provided. */
  public constructor(keyDescription: string, options?: IContextErrorOptions) {
    super(`The active context has no value for "${keyDescription}"`, options);
  }
}
