import type { ITokenReference } from "../tokens/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";
import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Raised when a provider or its injection metadata is malformed or cannot be interpreted. */
export class InvalidProviderError extends ContainerError {
  /** The token of the provider (or class) that is invalid. */
  readonly token: ITokenReference;

  /** Creates the error naming the offending token and the reason it is invalid. */
  public constructor(token: ITokenReference, reason: string, options?: IContainerErrorOptions) {
    super(`Invalid provider ${TokenDescription.describe(token)}: ${reason}`, options);
    this.token = token;
  }
}
