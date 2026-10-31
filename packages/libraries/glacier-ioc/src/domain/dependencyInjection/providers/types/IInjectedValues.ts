import type { IClassConstructor } from "./IClassConstructor.js";
import type { InjectionToken } from "../../tokens/InjectionToken.js";
import type { ITokenReference } from "../../tokens/types/ITokenReference.js";

/**
 * Resolves the value type represented by one injection token.
 * @template TToken Token whose injected runtime value type is derived.
 */
type IInjectedValue<TToken> =
  TToken extends InjectionToken<infer TValue>
    ? TValue
    : TToken extends IClassConstructor<infer TInstance>
      ? TInstance
      : unknown;

/**
 * Maps fixed tuples to factory args: typed tokens yield values, classes instances, symbols unknown.
 * Broad token lists produce `never[]` rather than positional inference.
 * @template TInject Ordered token list used to derive factory argument types.
 */
export type IInjectedValues<TInject extends readonly ITokenReference[]> =
  readonly ITokenReference[] extends TInject
    ? never[]
    : { -readonly [Key in keyof TInject]: IInjectedValue<TInject[Key]> };
