import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Raised when a context identifier is used where it is not valid. */
export class ContextIdMisuseError extends ContainerError {
  /** Creates the error from the reason the context identifier was misused. */
  public constructor(reason: string, options?: IContainerErrorOptions) {
    super(`Context id misuse: ${reason}`, options);
  }
}
