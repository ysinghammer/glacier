import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Identifies a container operation attempted after that container has closed. */
export class UseAfterCloseError extends ContainerError {
  /**
   * Constructs a closed-container failure naming the rejected operation.
   * @param operation Description of the operation that could not run.
   * @param options Optional underlying cause, preserved by the base error.
   */
  public constructor(operation: string, options?: IContainerErrorOptions) {
    super(`Container is closed; cannot ${operation}`, options);
  }
}
