import type { ITokenReference } from "../tokens/ITokenReference.js";
import type { IInjectedValues } from "./IInjectedValues.js";

/**
 * Provider that creates its value by calling `useFactory` with the resolved `inject` tokens, in order.
 * The factory is synchronous and runs once per container. Build it with `Providers.factory` so the factory
 * arguments are checked against the token types of the `inject` tuple.
 */
export interface IFactoryProvider<
  TInject extends readonly ITokenReference[] = readonly ITokenReference[],
  TValue = unknown,
> {
  /** The token consumers request. */
  readonly provide: ITokenReference;
  /** Creates the value from the injected arguments. */
  readonly useFactory: (...dependencies: IInjectedValues<TInject>) => TValue;
  /** Tokens resolved and passed to the factory in this order; omitted means no arguments. */
  readonly inject?: TInject;
}
