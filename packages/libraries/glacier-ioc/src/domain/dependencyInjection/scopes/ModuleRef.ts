import type { IConstructableClass } from "@glacier/reflection";
import type { IGetOptions } from "../modules/types/IGetOptions.js";
import type { IValueProvider } from "../providers/types/IValueProvider.js";
import type { InjectionToken } from "../tokens/InjectionToken.js";
import type { ContextId } from "./ContextId.js";

/** Module-scoped lookup API backed by a private built-in provider bound to each owning module. */
export abstract class ModuleRef {
  /**
   * Placeholder registration replaced with the module-bound reference during container setup.
   * @default Placeholder value is `undefined` until container binding.
   */
  public static readonly PROVIDER: IValueProvider = { provide: ModuleRef, useValue: undefined };

  /**
   * Gets a visible default-scope provider synchronously; module lookups are strict by default.
   * @template T Resolved value type carried by the injection token.
   * @param token Typed token identifying the provider.
   * @param options Optional visibility override; omitted means strict lookup.
   * @returns Shared default-scope provider value.
   */
  public abstract get<T>(token: InjectionToken<T>, options?: IGetOptions): T;
  /**
   * Gets a visible default-scope class provider synchronously.
   * @template T Constructed class instance type.
   * @param token Class identifying the provider.
   * @param options Optional visibility override; omitted means strict lookup.
   * @returns Shared default-scope class instance.
   */
  public abstract get<T extends object>(token: IConstructableClass<T>, options?: IGetOptions): T;
  /**
   * Gets a visible default-scope symbol provider synchronously.
   * @param token Symbol identifying the provider.
   * @param options Optional visibility override; omitted means strict lookup.
   * @returns Provider value, whose type is unknown for an untyped symbol.
   */
  public abstract get(token: symbol, options?: IGetOptions): unknown;

  /**
   * Resolves a provider of any scope, sharing request-scoped values for the supplied context.
   * @template T Resolved value type carried by the injection token.
   * @param token Typed token identifying the provider.
   * @param contextId Context identity; omitted resolution receives a fresh isolated identity.
   * @param options Optional visibility override; omitted means strict lookup.
   * @returns Promise of the provider value; rejects if lookup or construction fails.
   */
  public abstract resolve<T>(
    token: InjectionToken<T>,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<T>;
  /**
   * Resolves a class provider of any scope for the supplied context.
   * @template T Constructed class instance type.
   * @param token Class identifying the provider.
   * @param contextId Context identity; omitted resolution receives a fresh isolated identity.
   * @param options Optional visibility override; omitted means strict lookup.
   * @returns Promise of the class instance; rejects if lookup or construction fails.
   */
  public abstract resolve<T extends object>(
    token: IConstructableClass<T>,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<T>;
  /**
   * Resolves a symbol provider of any scope for the supplied context.
   * @param token Symbol identifying the provider.
   * @param contextId Context identity; omitted resolution receives a fresh isolated identity.
   * @param options Optional visibility override; omitted means strict lookup.
   * @returns Promise of the unknown-typed value; rejects if lookup or construction fails.
   */
  public abstract resolve(
    token: symbol,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<unknown>;
}
