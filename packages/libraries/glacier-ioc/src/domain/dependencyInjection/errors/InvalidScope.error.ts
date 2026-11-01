import type { ITokenReference } from "../tokens/types/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";
import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Identifies an unsupported provider lifetime or a scope incompatibility along a dependency path. */
export class InvalidScopeError extends ContainerError {
  /** Tokens from the requested one to the provider with the invalid scope. */
  public readonly dependencyPath: readonly ITokenReference[];

  /**
   * Constructs a scope validation failure with its dependency path and reason.
   * @param dependencyPath Tokens from the requested provider to the invalid scope.
   * @param reason Specific scope validation failure.
   * @param options Optional underlying cause, preserved by the base error.
   */
  public constructor(
    dependencyPath: readonly ITokenReference[],
    reason: string,
    options?: IContainerErrorOptions,
  ) {
    super(`Invalid scope: ${TokenDescription.describePath(dependencyPath)}: ${reason}`, options);
    this.dependencyPath = Object.freeze([...dependencyPath]);
  }
}
