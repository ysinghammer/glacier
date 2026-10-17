import type { ITokenReference } from "../tokens/ITokenReference.js";
import type { IFactoryProvider } from "./IFactoryProvider.js";

/** Builders that give provider declarations stronger compile-time checking than a bare object literal. */
export class Providers {
  /**
   * Returns the given factory provider unchanged while inferring the `inject` tuple, so a factory whose
   * parameters do not match the injected token types fails to compile. Performs no runtime work.
   */
  public static factory<const TInject extends readonly ITokenReference[], TValue>(
    provider: IFactoryProvider<TInject, TValue>,
  ): IFactoryProvider<TInject, TValue> {
    return provider;
  }
}
