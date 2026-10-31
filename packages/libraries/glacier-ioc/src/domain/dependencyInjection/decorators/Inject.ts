import { INJECT_TOKEN_METADATA } from "../metadata/InjectTokenMetadata.js";
import { InjectionToken } from "../tokens/InjectionToken.js";
import type { ITokenReference } from "../tokens/types/ITokenReference.js";

/**
 * Records an explicit constructor dependency token, overriding any compiler-emitted parameter type.
 * @param token Token to resolve; an `InjectionToken` is recorded by its symbol identity.
 * @returns A parameter decorator that stores token metadata without constructing a dependency.
 */
export function Inject(token: ITokenReference): ParameterDecorator {
  const identity = token instanceof InjectionToken ? token.symbol : token;
  return INJECT_TOKEN_METADATA.decorator(identity);
}
