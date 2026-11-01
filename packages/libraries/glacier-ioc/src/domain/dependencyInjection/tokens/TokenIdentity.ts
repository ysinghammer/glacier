import { InjectionToken } from "./InjectionToken.js";
import type { IToken } from "./types/IToken.js";
import type { ITokenReference } from "./types/ITokenReference.js";

/** Normalizes typed token references to the class or symbol used for provider identity. */
export class TokenIdentity {
  /**
   * Returns the lookup identity for a class, symbol or typed token.
   * @param token Consumer token reference to normalize.
   * @returns The wrapped symbol for an `InjectionToken`, otherwise the original token.
   */
  public static of(token: ITokenReference): IToken {
    return token instanceof InjectionToken ? token.symbol : token;
  }
}
