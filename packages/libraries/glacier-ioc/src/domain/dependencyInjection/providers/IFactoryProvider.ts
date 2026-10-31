import type { IProviderScope } from "../metadata/IProviderScope.js";
import type { ITokenReference } from "../tokens/ITokenReference.js";
import type { IInjectedValues } from "./IInjectedValues.js";

/**
 * Provider that creates its value by calling `useFactory` with the resolved `inject` tokens, in order.
 * The factory may be async: its promise is awaited before dependents are constructed. It runs once per container unless a TRANSIENT or REQUEST `scope` applies. Build it with `Providers.factory` so the factory
 * arguments are checked against the token types of the `inject` tuple.
 */
export interface IFactoryProvider<
  TInject extends readonly ITokenReference[] = readonly ITokenReference[],
  TValue = unknown,
> {
  /** The token consumers request. */
  readonly provide: ITokenReference;
  /** Creates the value, or a promise of it, from the injected arguments; failures surface as `ProviderCreationError`. */
  readonly useFactory: (...dependencies: IInjectedValues<TInject>) => TValue | Promise<TValue>;
  /** Tokens resolved and passed to the factory in this order; omitted means no arguments. */
  readonly inject?: TInject;
  /** Lifetime of the provider; omitted means `"default"`. */
  readonly scope?: IProviderScope;
}
