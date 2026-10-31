import type { ITokenReference } from "../tokens/types/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";
import { ContainerError } from "./ContainerError.error.js";
import type { IContainerErrorOptions } from "./IContainerErrorOptions.js";

/** Identifies a malformed provider declaration or unreadable provider injection metadata. */
export class InvalidProviderError extends ContainerError {
  /** The token of the provider (or class) that is invalid. */
  public readonly token: ITokenReference;

  /**
   * Constructs a provider validation failure naming its token and reason.
   * @param token Provider token or class associated with the invalid declaration.
   * @param reason Specific validation failure.
   * @param options Optional underlying cause, preserved by the base error.
   */
  public constructor(token: ITokenReference, reason: string, options?: IContainerErrorOptions) {
    super(`Invalid provider ${TokenDescription.describe(token)}: ${reason}`, options);
    this.token = token;
  }
}
