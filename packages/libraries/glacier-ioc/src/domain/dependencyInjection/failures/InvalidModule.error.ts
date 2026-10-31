import type { ITokenReference } from "../tokens/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";
import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Raised when a module is malformed, undecorated, exports something unavailable, or is not in the container. */
export class InvalidModuleError extends ContainerError {
  /** The module class (or offending token) the failure is about. */
  readonly target: ITokenReference;

  /** Creates the error naming the offending module and the reason it is invalid. */
  public constructor(target: ITokenReference, reason: string, options?: IContainerErrorOptions) {
    super(`Invalid module ${TokenDescription.describe(target)}: ${reason}`, options);
    this.target = target;
  }
}
