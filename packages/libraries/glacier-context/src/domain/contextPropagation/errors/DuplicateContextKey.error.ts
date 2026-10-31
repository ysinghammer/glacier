import { ContextError } from "./ContextError.error.js";
import type { IContextErrorOptions } from "./IContextErrorOptions.js";

/** Signals that one `GlacierContext.run` call was given multiple entries for the same key. */
export class DuplicateContextKeyError extends ContextError {
  /**
   * Creates an error identifying the key repeated within one run's entry list.
   * @param keyDescription - Diagnostic label of the repeated key.
   * @param options - Optional cause metadata; omitted options leave the cause unset.
   */
  public constructor(keyDescription: string, options?: IContextErrorOptions) {
    super(`The key "${keyDescription}" was given more than once to a single run`, options);
  }
}
