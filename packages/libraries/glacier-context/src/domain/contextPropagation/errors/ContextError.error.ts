import type { IContextErrorOptions } from "./IContextErrorOptions.js";

/** Base class for exceptional context failures; callers can catch it and retain subclass-specific names. */
export class ContextError extends Error {
  /**
   * Creates the error, sets its name to the concrete subclass name, and preserves any supplied cause.
   * @param message - Human-readable description of this exceptional context failure.
   * @param options - Optional cause metadata; omitted options leave the cause unset.
   */
  public constructor(message: string, options?: IContextErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
