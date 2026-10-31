import type { ITokenReference } from "../tokens/types/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";
import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Identifies malformed module metadata, unavailable exports, or a module absent from the graph. */
export class InvalidModuleError extends ContainerError {
  /** The module class (or offending token) the failure is about. */
  public readonly target: ITokenReference;

  /**
   * Constructs a module validation failure naming its target and reason.
   * @param target Module or token associated with the invalid declaration.
   * @param reason Specific validation failure.
   * @param options Optional underlying cause, preserved by the base error.
   */
  public constructor(target: ITokenReference, reason: string, options?: IContainerErrorOptions) {
    super(`Invalid module ${TokenDescription.describe(target)}: ${reason}`, options);
    this.target = target;
  }
}
