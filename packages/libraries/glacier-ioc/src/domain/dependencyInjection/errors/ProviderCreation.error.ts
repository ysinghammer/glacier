import { ContainerError } from "./ContainerError.error.js";
import type { ITokenReference } from "../tokens/types/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";

/** Wraps a factory provider failure while preserving the original value as its cause. */
export class ProviderCreationError extends ContainerError {
  /**
   * Constructs a factory failure and retains the original thrown value as cause.
   * @param token Token whose factory failed.
   * @param cause Original thrown value or rejection reason.
   */
  public constructor(token: ITokenReference, cause: unknown) {
    super(`Factory for ${TokenDescription.describe(token)} failed`, { cause });
  }
}
