import { ContainerError } from "./ContainerError.error.js";
import type { ITokenReference } from "../tokens/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";

/** Raised when a factory provider throws or rejects while its value is created; the failure is the `cause`. */
export class ProviderCreationError extends ContainerError {
  /** Creates the error naming the token whose factory failed. */
  public constructor(token: ITokenReference, cause: unknown) {
    super(`Factory for ${TokenDescription.describe(token)} failed`, { cause });
  }
}
