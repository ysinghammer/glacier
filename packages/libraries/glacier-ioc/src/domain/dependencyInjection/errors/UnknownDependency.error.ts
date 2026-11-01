import type { ITokenReference } from "../tokens/types/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";
import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Identifies an unresolved dependency and the ordered path that led to it. */
export class UnknownDependencyError extends ContainerError {
  /** Tokens from the requested one to the missing dependency, in resolution order. */
  public readonly dependencyPath: readonly ITokenReference[];

  /**
   * Constructs an unresolved-dependency failure with its path in the message.
   * @param dependencyPath Tokens from the requested dependency to the missing token.
   * @param options Optional underlying cause, preserved by the base error.
   */
  public constructor(dependencyPath: readonly ITokenReference[], options?: IContainerErrorOptions) {
    super(`Unknown dependency: ${TokenDescription.describePath(dependencyPath)}`, options);
    this.dependencyPath = Object.freeze([...dependencyPath]);
  }
}
