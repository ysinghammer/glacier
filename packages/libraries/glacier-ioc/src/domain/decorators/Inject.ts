import { INJECT_TOKEN_METADATA } from "../metadata/InjectTokenMetadata.js";
import { InjectionToken } from "../tokens/InjectionToken.js";
import type { ITokenReference } from "../tokens/ITokenReference.js";

/**
 * Constructor-parameter decorator that overrides the implicit `design:paramtypes` token with an explicit
 * class, symbol or `InjectionToken`. Typed tokens are stored as their symbol. Records metadata only.
 */
export function Inject(token: ITokenReference): ParameterDecorator {
  const identity = token instanceof InjectionToken ? token.symbol : token;
  return INJECT_TOKEN_METADATA.decorator(identity);
}
