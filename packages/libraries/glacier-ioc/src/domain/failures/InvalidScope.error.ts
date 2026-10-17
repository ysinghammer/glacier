import type { ITokenReference } from "../tokens/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";
import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Raised when a provider scope is unsupported or conflicts with its dependents or dependencies. */
export class InvalidScopeError extends ContainerError {
  /** Tokens from the requested one to the provider with the invalid scope. */
  readonly dependencyPath: readonly ITokenReference[];

  /** Creates the error from the dependency path and the reason the scope is invalid. */
  public constructor(
    dependencyPath: readonly ITokenReference[],
    reason: string,
    options?: IContainerErrorOptions,
  ) {
    super(`Invalid scope: ${TokenDescription.describePath(dependencyPath)}: ${reason}`, options);
    this.dependencyPath = Object.freeze([...dependencyPath]);
  }
}
