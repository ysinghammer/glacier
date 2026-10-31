import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Reports use of a value that is not an allowed resolution context identifier. */
export class ContextIdMisuseError extends ContainerError {
  /**
   * Constructs a context misuse failure with the supplied reason in its message.
   * @param reason Explanation of why the supplied context identifier is invalid.
   * @param options Optional underlying cause, preserved by the base error.
   */
  public constructor(reason: string, options?: IContainerErrorOptions) {
    super(`Context id misuse: ${reason}`, options);
  }
}
