import type { IConstructableClass } from "@glacier/reflection";
import { ModuleGraph } from "../domain/modules/ModuleGraph.js";
import type { IModuleReference } from "../domain/modules/IModuleReference.js";
import type { ContextId } from "../domain/scopes/ContextId.js";
import type { InjectionToken } from "../domain/tokens/InjectionToken.js";
import type { ITokenReference } from "../domain/tokens/ITokenReference.js";
import type { IGetOptions } from "../domain/modules/IGetOptions.js";
import { AggregateContainerError } from "../domain/failures/AggregateContainer.error.js";
import type { LifecycleHookError } from "../domain/failures/LifecycleHook.error.js";
import { InstanceResolver } from "./InstanceResolver.js";
import { LifecycleCoordinator } from "./LifecycleCoordinator.js";
import { ModuleLookup } from "./ModuleLookup.js";

/**
 * Dependency-injection container over a module graph resolving providers by scope: DEFAULT providers are
 * constructed once and shared, REQUEST providers once per context id, TRANSIENT ones on every `resolve`. The graph is validated eagerly in
 * `create`, including missing dependencies and cycles. `create` then constructs every DEFAULT provider, awaiting
 * async factories in dependency order, and runs their lifecycle hooks. `close` runs the shutdown hooks.
 */
export class GlacierContainer {
  readonly #graph: ModuleGraph;
  readonly #resolver: InstanceResolver;
  readonly #lifecycle: LifecycleCoordinator;
  #closing: Promise<void> | undefined;

  private constructor(
    graph: ModuleGraph,
    resolver: InstanceResolver,
    lifecycle: LifecycleCoordinator,
  ) {
    this.#graph = graph;
    this.#resolver = resolver;
    this.#lifecycle = lifecycle;
  }

  /**
   * Builds a container from a root module class or dynamic module, traversing its imports once per module
   * and validating module metadata, provider shapes, class metadata, scopes, exports, missing dependencies and
   * cycles up front, then creating every DEFAULT-scope provider in module dependency order (async factories are
   * awaited before their dependents are constructed) and running `onModuleInit` for all modules, then
   * `onContainerInit`, on instances that implement them.
   * Rejects with one `AggregateContainerError` listing every validation problem, in which case nothing is
   * constructed; with `ProviderCreationError` when a factory fails; or with `LifecycleHookError` when a startup
   * hook fails, after the shutdown hooks have run on every instance. A failing shutdown hook then turns the
   * rejection into an `AggregateContainerError` of both failures.
   */
  public static async create(root: IModuleReference): Promise<GlacierContainer> {
    const graph = ModuleGraph.build(root);
    const resolver = new InstanceResolver(graph);
    const lifecycle = new LifecycleCoordinator(await resolver.createDefaultInstances());
    const startupFailure = await lifecycle.initialize();
    if (startupFailure !== undefined) {
      const cleanupFailures = await lifecycle.shutdown();
      throw GlacierContainer.#summarize([startupFailure, ...cleanupFailures]);
    }
    return new GlacierContainer(graph, resolver, lifecycle);
  }

  /**
   * Returns the shared instance for the token, created when the container was.
   * By default the whole container is searched, preferring what the root module sees;
   * `{ strict: true }` restricts the lookup to the root module's visibility.
   * Throws `UseAfterCloseError` after `close`, `UnknownDependencyError` when the requested token has no visible provider and
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
   * Throws `UseAfterCloseError` after `close` and `InvalidModuleError` when the module is not reachable from
   * the root.
   */
  public select(module: IModuleReference): ModuleLookup {
    this.#resolver.assertOpen("select a module");
    return new ModuleLookup(this.#resolver, this.#graph.select(module));
  }

  /**
   * Shuts the container down: `onModuleDestroy`, then `beforeContainerShutdown`, then `onContainerShutdown`,
   * each awaited over the instances in the reverse of initialization order. From the first call on, every
   * `get`, `resolve` and `select` throws `UseAfterCloseError`. Calling `close` again returns the same promise,
   * so hooks run once. A failing hook never skips the others; the promise then rejects with the
   * `LifecycleHookError`, or with an `AggregateContainerError` when several hooks failed.
   */
  public close(): Promise<void> {
    this.#closing ??= this.#shutDown();
    return this.#closing;
  }

  /** Closes the resolver, runs the shutdown hooks and reports their failures. */
  async #shutDown(): Promise<void> {
    this.#resolver.close();
    const failures = await this.#lifecycle.shutdown();
    if (failures.length > 0) throw GlacierContainer.#summarize(failures);
  }

  /** Returns the single failure itself, or an aggregate when there are several. */
  static #summarize(failures: readonly LifecycleHookError[]): Error {
    const [only] = failures;
    if (failures.length === 1 && only !== undefined) return only;
    return new AggregateContainerError(failures);
  }
}
