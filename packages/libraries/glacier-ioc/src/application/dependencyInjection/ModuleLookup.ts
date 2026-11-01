import type { IConstructableClass } from "@glacier/reflection";
import type { ModuleNode } from "../../domain/dependencyInjection/modules/ModuleNode.js";
import type { InjectionToken } from "../../domain/dependencyInjection/tokens/InjectionToken.js";
import type { ITokenReference } from "../../domain/dependencyInjection/tokens/types/ITokenReference.js";
import type { ContextId } from "../../domain/dependencyInjection/scopes/ContextId.js";
import { ModuleRef } from "../../domain/dependencyInjection/scopes/ModuleRef.js";
import type { IGetOptions } from "../../domain/dependencyInjection/modules/types/IGetOptions.js";
import type { InstanceResolver } from "./InstanceResolver.js";

/** Private state for one selected-module view; neither field is exposed through serialization. */
interface IModuleLookupState {
  /** Resolver shared with the owning container; it retains provider instances and lifecycle state. */
  readonly resolver: InstanceResolver;
  /** Selected module whose visibility rules govern every lookup made through this view. */
  readonly module: ModuleNode;
}
const MODULE_LOOKUP_STATES = new WeakMap<ModuleLookup, IModuleLookupState>();

/** Provides `ModuleRef` lookups from one module; non-strict options search the full container graph. */
export class ModuleLookup extends ModuleRef {
  /** Reads private view state and rejects receivers that were not initialized by this class.
   * @returns The resolver and selected module associated with this lookup.
   * @throws {TypeError} The receiver is not a registered `ModuleLookup` instance.
   */
  private get state(): IModuleLookupState {
    const state = MODULE_LOOKUP_STATES.get(this);
    if (state === undefined) throw new TypeError("Invalid module lookup receiver");
    return state;
  }

  /** Creates a view bound to one module and the container's shared resolver.
   * @param resolver Resolver used to locate and construct providers.
   * @param module Module that defines this view's default visibility.
   */
  public constructor(resolver: InstanceResolver, module: ModuleNode) {
    super();
    MODULE_LOOKUP_STATES.set(this, { resolver, module });
  }

  /** Gets a shared DEFAULT-scoped instance visible from this module.
   * @param token Token identifying the provider to retrieve.
   * @param options Lookup options; `false` searches all modules (default: `true`).
   * @template T Provider value type inferred from the injection token.
   * @returns The shared provider instance matching `token`.
   */
  public override get<T>(token: InjectionToken<T>, options?: IGetOptions): T;
  /** Gets a shared DEFAULT-scoped instance visible from this module.
   * @param token Constructable class identifying the provider to retrieve.
   * @param options Lookup options; `false` searches all modules (default: `true`).
   * @template T Object instance type constructed by the class token.
   * @returns The shared provider instance matching `token`.
   */
  public override get<T extends object>(token: IConstructableClass<T>, options?: IGetOptions): T;
  /** Gets a shared DEFAULT-scoped instance visible from this module.
   * @param token Symbol identifying the provider to retrieve.
   * @param options Lookup options; `false` searches all modules (default: `true`).
   * @returns The shared provider instance matching `token`.
   */
  public override get(token: symbol, options?: IGetOptions): unknown;
  /** Gets a shared DEFAULT-scoped instance visible from this module.
   * @param token Token reference identifying the provider to retrieve.
   * @param options Lookup options; `false` searches all modules (default: `true`).
   * @returns The shared provider instance matching `token`.
   */
  public override get(token: ITokenReference, options: IGetOptions = {}): unknown {
    return this.state.resolver.get(token, this.state.module, options.strict ?? true);
  }

  /** Resolves providers by scope: DEFAULT is shared, REQUEST is context-shared, and TRANSIENT is new.
   * @param token Token identifying the provider to resolve.
   * @param contextId Optional `ContainerContext` id; omission creates a fresh context.
   * @param options Lookup options; omitted `strict` defaults to `true`.
   * @returns Promise for instance; rejects for invalid context, missing provider, or failed creation.
   * @template T Provider value type inferred from the injection token.
   */
  public override resolve<T>(
    token: InjectionToken<T>,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<T>;
  /** Resolves providers by scope: DEFAULT is shared, REQUEST is context-shared, and TRANSIENT is new.
   * @param token Constructable class identifying the provider to resolve.
   * @param contextId Optional `ContainerContext` id; omission creates a fresh context.
   * @param options Lookup options; omitted `strict` defaults to `true`.
   * @returns Promise for instance; rejects for invalid context, missing provider, or failed creation.
   * @template T Object instance type constructed by the class token.
   */
  public override resolve<T extends object>(
    token: IConstructableClass<T>,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<T>;
  /** Resolves providers by scope: DEFAULT is shared, REQUEST is context-shared, and TRANSIENT is new.
   * @param token Symbol identifying the provider to resolve.
   * @param contextId Optional `ContainerContext` id; omission creates a fresh context.
   * @param options Lookup options; omitted `strict` defaults to `true`.
   * @returns Promise for instance; rejects for invalid context, missing provider, or failed creation.
   */
  public override resolve(
    token: symbol,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<unknown>;
  /** Resolves providers by scope: DEFAULT is shared, REQUEST is context-shared, and TRANSIENT is new.
   * @param token Token reference identifying the provider to resolve.
   * @param contextId Optional `ContainerContext` id; omission creates a fresh context.
   * @param options Lookup options; omitted `strict` defaults to `true`.
   * @returns Promise for instance; rejects for invalid context, missing provider, or failed creation.
   */
  public override resolve(
    token: ITokenReference,
    contextId?: ContextId,
    options: IGetOptions = {},
  ): Promise<unknown> {
    return this.state.resolver.resolve(token, this.state.module, options.strict ?? true, contextId);
  }
}
