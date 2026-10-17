import type { IConstructableClass } from "@glacier/reflection";
import type { ModuleNode } from "../domain/modules/ModuleNode.js";
import type { InjectionToken } from "../domain/tokens/InjectionToken.js";
import type { ITokenReference } from "../domain/tokens/ITokenReference.js";
import type { ContextId } from "../domain/scopes/ContextId.js";
import { ModuleRef } from "../domain/scopes/ModuleRef.js";
import type { IGetOptions } from "../domain/modules/IGetOptions.js";
import type { InstanceResolver } from "./InstanceResolver.js";

/**
 * The container as seen from one module, also injectable as `ModuleRef`; lookups are strict unless
 * `{ strict: false }` is given.
 */
export class ModuleLookup extends ModuleRef {
  readonly #resolver: InstanceResolver;
  readonly #module: ModuleNode;

  /** Wraps the resolver for one module; created by `GlacierContainer.select`. */
  public constructor(resolver: InstanceResolver, module: ModuleNode) {
    super();
    this.#resolver = resolver;
    this.#module = module;
  }

  /**
   * Returns the shared instance of the token as visible to the selected module (own providers, imports'
   * exports, global exports). `{ strict: false }` also searches every other module of the container.
   * Throws `UnknownDependencyError` when nothing matches and `InvalidScopeError` for TRANSIENT or REQUEST
   * providers, which need `resolve`.
   */
  public override get<T>(token: InjectionToken<T>, options?: IGetOptions): T;
  public override get<T extends object>(token: IConstructableClass<T>, options?: IGetOptions): T;
  public override get(token: symbol, options?: IGetOptions): unknown;
  public override get(token: ITokenReference, options: IGetOptions = {}): unknown {
    return this.#resolver.get(token, this.#module, options.strict ?? true);
  }

  /**
   * Resolves a provider of any scope as visible to the selected module for a context; no id means a fresh
   * context. Rejects with `ContextIdMisuseError` for an id not created by `ContainerContext` and with
   * `UnknownDependencyError` when nothing matches.
   */
  public override resolve<T>(
    token: InjectionToken<T>,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<T>;
  public override resolve<T extends object>(
    token: IConstructableClass<T>,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<T>;
  public override resolve(
    token: symbol,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<unknown>;
  public override resolve(
    token: ITokenReference,
    contextId?: ContextId,
    options: IGetOptions = {},
  ): Promise<unknown> {
    return this.#resolver.resolve(token, this.#module, options.strict ?? true, contextId);
  }
}
