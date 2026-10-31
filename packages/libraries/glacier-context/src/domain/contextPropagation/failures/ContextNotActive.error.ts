import { ContextError } from "./ContextError.error.js";
import type { IContextErrorOptions } from "./IContextErrorOptions.js";

/** Raised when a value is read outside any `GlacierContext.run` continuation. */
export class ContextNotActiveError extends ContextError {
  /** Creates the error for the key whose read found no active context. */
  public constructor(keyDescription: string, options?: IContextErrorOptions) {
    super(
      `No active context to read "${keyDescription}"; wrap the call in GlacierContext.run`,
      options,
    );
  }
}
