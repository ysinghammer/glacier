import type { ITokenReference } from "../tokens/types/ITokenReference.js";
import type { IFactoryProvider } from "./types/IFactoryProvider.js";

/** Provider declaration builders that preserve tuple-based factory argument inference. */
export class Providers {
  /**
   * Preserves an inject tuple so TypeScript checks corresponding factory argument types.
   * @template TInject Ordered tokens injected into the factory.
   * @template TValue Value returned by the factory.
   * @param provider Factory provider declaration to preserve.
   * @returns The same provider declaration, unchanged at runtime.
   */
  public static factory<const TInject extends readonly ITokenReference[], TValue>(
    provider: IFactoryProvider<TInject, TValue>,
  ): IFactoryProvider<TInject, TValue> {
    return provider;
  }
}
