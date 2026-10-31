import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Raised when an operation is attempted on a container that has already been closed. */
export class UseAfterCloseError extends ContainerError {
  /** Creates the error naming the attempted operation. */
  public constructor(operation: string, options?: IContainerErrorOptions) {
    super(`Container is closed; cannot ${operation}`, options);
  }
}
