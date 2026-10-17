import type { ITokenReference } from "../tokens/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";
import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Raised when a dependency has no provider; the message shows the path that led to it. */
export class UnknownDependencyError extends ContainerError {
  /** Tokens from the requested one to the missing dependency, in resolution order. */
  readonly dependencyPath: readonly ITokenReference[];

  /** Creates the error with the full dependency path included in its message. */
  public constructor(dependencyPath: readonly ITokenReference[], options?: IContainerErrorOptions) {
    super(`Unknown dependency: ${TokenDescription.describePath(dependencyPath)}`, options);
    this.dependencyPath = Object.freeze([...dependencyPath]);
  }
}
