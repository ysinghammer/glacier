import { ContextError } from "./ContextError.error.js";
import type { IContextErrorOptions } from "./IContextErrorOptions.js";

/** Signals that a context value was read outside every active `GlacierContext.run` continuation. */
export class ContextNotActiveError extends ContextError {
  /**
   * Creates an error identifying the requested key and the absence of an active context.
   * @param keyDescription - Diagnostic label of the key whose read found no active context.
   * @param options - Optional cause metadata; omitted options leave the cause unset.
   */
  public constructor(keyDescription: string, options?: IContextErrorOptions) {
    super(
      `No active context to read "${keyDescription}"; wrap the call in GlacierContext.run`,
      options,
    );
  }
}
