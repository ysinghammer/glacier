import type { IConstructableClass } from "@glacier/reflection";
import { ModuleGraph } from "../domain/modules/ModuleGraph.js";
import type { IModuleReference } from "../domain/modules/IModuleReference.js";
import type { ContextId } from "../domain/scopes/ContextId.js";
import type { InjectionToken } from "../domain/tokens/InjectionToken.js";
import type { ITokenReference } from "../domain/tokens/ITokenReference.js";
import type { IGetOptions } from "../domain/modules/IGetOptions.js";
import { InstanceResolver } from "./InstanceResolver.js";
import { ModuleLookup } from "./ModuleLookup.js";

/**
 * Dependency-injection container over a module graph resolving providers by scope: DEFAULT providers are
 * constructed at most once and shared, REQUEST providers once per context id, TRANSIENT ones on every `resolve`. The graph is validated eagerly in
 * `create`, including missing dependencies and cycles; instances are constructed lazily on first use.
 */
export class GlacierContainer {
  readonly #graph: ModuleGraph;
  readonly #resolver: InstanceResolver;

  private constructor(graph: ModuleGraph) {
    this.#graph = graph;
    this.#resolver = new InstanceResolver(graph);
  }

  /**
   * Builds a container from a root module class or dynamic module, traversing its imports once per module
   * and validating module metadata, provider shapes, class metadata, scopes, exports, missing dependencies and
   * cycles up front.
   * Throws one `AggregateContainerError` listing every problem found; nothing is constructed.
   */
  public static create(root: IModuleReference): GlacierContainer {
    return new GlacierContainer(ModuleGraph.build(root));
  }

  /**
   * Returns the shared instance for the token, constructing it and its dependencies on first use.
   * By default the whole container is searched, preferring what the root module sees;
   * `{ strict: true }` restricts the lookup to the root module's visibility.
   * Throws `UnknownDependencyError` when the requested token has no visible provider and
   * `InvalidScopeError` when the provider is TRANSIENT or REQUEST-scoped (or depends on a REQUEST provider),
   * which only `resolve` can serve.
   */
  public get<T>(token: InjectionToken<T>, options?: IGetOptions): T;
  public get<T extends object>(token: IConstructableClass<T>, options?: IGetOptions): T;
  public get(token: symbol, options?: IGetOptions): unknown;
  public get(token: ITokenReference, options: IGetOptions = {}): unknown {
    return this.#resolver.get(token, this.#graph.root, options.strict ?? false);
  }

  /**
   * Resolves a provider of any scope for a context: REQUEST providers are shared within one context id,
   * TRANSIENT ones are created anew, DEFAULT ones are the shared singletons. Without an id a fresh context is
   * used. Lookup follows `get`, including `strict`. Rejects with `ContextIdMisuseError` for an id not created
   * by `ContainerContext` and with `UnknownDependencyError` when the token has no visible provider.
   */
  public resolve<T>(
    token: InjectionToken<T>,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<T>;
  public resolve<T extends object>(
    token: IConstructableClass<T>,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<T>;
  public resolve(token: symbol, contextId?: ContextId, options?: IGetOptions): Promise<unknown>;
  public resolve(
    token: ITokenReference,
    contextId?: ContextId,
    options: IGetOptions = {},
  ): Promise<unknown> {
    return this.#resolver.resolve(token, this.#graph.root, options.strict ?? false, contextId);
  }

  /**
   * Returns a view restricted to one module of the container, given as its class or dynamic module.
   * Throws `InvalidModuleError` when the module is not reachable from the root.
   */
  public select(module: IModuleReference): ModuleLookup {
    return new ModuleLookup(this.#resolver, this.#graph.select(module));
  }
}
