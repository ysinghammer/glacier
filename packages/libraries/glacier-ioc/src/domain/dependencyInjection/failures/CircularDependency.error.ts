import type { ITokenReference } from "../tokens/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";
import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Raised when providers depend on each other in a cycle; the message shows the cycle path. */
export class CircularDependencyError extends ContainerError {
  /** Tokens along the cycle, ending with the token that closes it. */
  readonly dependencyPath: readonly ITokenReference[];

  /** Creates the error with the full cycle included in its message. */
  public constructor(dependencyPath: readonly ITokenReference[], options?: IContainerErrorOptions) {
    super(`Circular dependency: ${TokenDescription.describePath(dependencyPath)}`, options);
    this.dependencyPath = Object.freeze([...dependencyPath]);
  }
}
