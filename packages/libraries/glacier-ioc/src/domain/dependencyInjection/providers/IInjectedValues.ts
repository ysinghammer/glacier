import type { IClassConstructor } from "./IClassConstructor.js";
import type { InjectionToken } from "../tokens/InjectionToken.js";
import type { ITokenReference } from "../tokens/ITokenReference.js";

type IInjectedValue<TToken> =
  TToken extends InjectionToken<infer TValue>
    ? TValue
    : TToken extends IClassConstructor<infer TInstance>
      ? TInstance
      : unknown;

/**
 * Maps an `inject` token tuple to the argument types a factory receives: an `InjectionToken<T>` yields `T`,
 * a class yields its instance, and a symbol yields `unknown`. A non-tuple token list accepts any factory.
 */
export type IInjectedValues<TInject extends readonly ITokenReference[]> =
  readonly ITokenReference[] extends TInject
    ? never[]
    : { -readonly [Key in keyof TInject]: IInjectedValue<TInject[Key]> };
