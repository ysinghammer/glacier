import { InjectionToken } from "./InjectionToken.js";
import type { IToken } from "./IToken.js";
import type { ITokenReference } from "./ITokenReference.js";

/** Maps token references to the plain token that keys provider lookups. */
export class TokenIdentity {
  /** Typed injection tokens are keyed by their symbol; classes and symbols are keyed as themselves. */
  public static of(token: ITokenReference): IToken {
    return token instanceof InjectionToken ? token.symbol : token;
  }
}
