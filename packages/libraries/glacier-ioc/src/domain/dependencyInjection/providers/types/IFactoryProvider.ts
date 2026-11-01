import type { IProviderScope } from "../../metadata/types/IProviderScope.js";
import type { ITokenReference } from "../../tokens/types/ITokenReference.js";
import type { IInjectedValues } from "./IInjectedValues.js";

/**
 * Provider that calls a factory with resolved tokens in order, awaiting asynchronous results.
 * @template TInject Ordered injected token tuple used to infer factory argument types.
 * @template TValue Value produced by the factory, synchronously or asynchronously.
 * @remarks Use `Providers.factory` to check factory arguments against a fixed token tuple.
 */
export interface IFactoryProvider<
  TInject extends readonly ITokenReference[] = readonly ITokenReference[],
  TValue = unknown,
> {
  /** Token consumers request to receive the factory result. */
  readonly provide: ITokenReference;
  /**
   * Creates the provided value from resolved dependencies.
   * @param dependencies Values resolved from `inject`, in the declared order.
   * @returns Factory value or promise; factory failures reject provider creation.
   */
  readonly useFactory: (...dependencies: IInjectedValues<TInject>) => TValue | Promise<TValue>;
  /**
   * Tokens resolved and passed to the factory in order.
   * @default Empty tuple when omitted.
   */
  readonly inject?: TInject;
  /**
   * Lifetime of the factory result.
   * @default `"default"` when omitted.
   */
  readonly scope?: IProviderScope;
}
