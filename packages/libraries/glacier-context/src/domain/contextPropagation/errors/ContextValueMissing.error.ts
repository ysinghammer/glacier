import { ContextError } from "./ContextError.error.js";
import type { IContextErrorOptions } from "./IContextErrorOptions.js";

/** Signals that an active context has no value associated with the requested key. */
export class ContextValueMissingError extends ContextError {
  /**
   * Creates an error identifying the key absent from the active context.
   * @param keyDescription - Diagnostic label of the key with no active value.
   * @param options - Optional cause metadata; omitted options leave the cause unset.
   */
  public constructor(keyDescription: string, options?: IContextErrorOptions) {
    super(`The active context has no value for "${keyDescription}"`, options);
  }
}
