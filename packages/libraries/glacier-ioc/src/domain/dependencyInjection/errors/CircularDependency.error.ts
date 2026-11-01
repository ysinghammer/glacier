import type { ITokenReference } from "../tokens/types/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";
import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Identifies a provider or module dependency cycle and preserves its ordered token path. */
export class CircularDependencyError extends ContainerError {
  /** Tokens along the cycle, ending with the token that closes it. */
  public readonly dependencyPath: readonly ITokenReference[];

  /**
   * Constructs a cycle error with the dependency path in its message and stored data.
   * @param dependencyPath Ordered tokens in the cycle, including its closing token.
   * @param options Optional Error cause preserved by the base error.
   */
  public constructor(dependencyPath: readonly ITokenReference[], options?: IContainerErrorOptions) {
    super(`Circular dependency: ${TokenDescription.describePath(dependencyPath)}`, options);
    this.dependencyPath = Object.freeze([...dependencyPath]);
  }
}
