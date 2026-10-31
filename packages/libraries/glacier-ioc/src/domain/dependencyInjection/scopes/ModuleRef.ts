import type { IConstructableClass } from "@glacier/reflection";
import type { IGetOptions } from "../modules/IGetOptions.js";
import type { IValueProvider } from "../providers/IValueProvider.js";
import type { InjectionToken } from "../tokens/InjectionToken.js";
import type { ContextId } from "./ContextId.js";

/**
 * Lookup of providers from one module, injectable into that module's providers by class token.
 * Every module owns a `ModuleRef` provider that the container binds to the module; it is not exported.
 */
export abstract class ModuleRef {
  /** Built-in registration of the module-bound `ModuleRef`; the container replaces its placeholder value. */
  public static readonly PROVIDER: IValueProvider = { provide: ModuleRef, useValue: undefined };

  /**
   * Returns the shared instance of a DEFAULT-scope provider visible to the module (`strict` defaults to
   * `true`). Throws `InvalidScopeError` for TRANSIENT/REQUEST providers, which need `resolve`, and
   * `UnknownDependencyError` when nothing matches.
   */
  public abstract get<T>(token: InjectionToken<T>, options?: IGetOptions): T;
  public abstract get<T extends object>(token: IConstructableClass<T>, options?: IGetOptions): T;
  public abstract get(token: symbol, options?: IGetOptions): unknown;

  /**
   * Resolves a provider of any scope for a context; without an id a fresh context is used.
   * Rejects with `ContextIdMisuseError` for an id not created by `ContainerContext` and with
   * `UnknownDependencyError` when nothing matches.
   */
  public abstract resolve<T>(
    token: InjectionToken<T>,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<T>;
  public abstract resolve<T extends object>(
    token: IConstructableClass<T>,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<T>;
  public abstract resolve(
    token: symbol,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<unknown>;
}
