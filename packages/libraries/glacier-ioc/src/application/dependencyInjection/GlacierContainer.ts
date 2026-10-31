import type { IConstructableClass } from "@glacier/reflection";
import { ModuleGraph } from "../../domain/dependencyInjection/modules/ModuleGraph.js";
import type { IModuleReference } from "../../domain/dependencyInjection/modules/types/IModuleReference.js";
import type { ContextId } from "../../domain/dependencyInjection/scopes/ContextId.js";
import type { InjectionToken } from "../../domain/dependencyInjection/tokens/InjectionToken.js";
import type { ITokenReference } from "../../domain/dependencyInjection/tokens/types/ITokenReference.js";
import type { IGetOptions } from "../../domain/dependencyInjection/modules/types/IGetOptions.js";
import { AggregateContainerError } from "../../domain/dependencyInjection/errors/AggregateContainer.error.js";
import type { LifecycleHookError } from "../../domain/dependencyInjection/errors/LifecycleHook.error.js";
import { InstanceResolver } from "./InstanceResolver.js";
import { LifecycleCoordinator } from "./LifecycleCoordinator.js";
import { ModuleLookup } from "./ModuleLookup.js";

/** Private container internals; provider instances and in-flight shutdown stay out of serialization. */
interface IContainerState {
  /** Validated reachable modules used for provider visibility and resolution. */
  readonly graph: ModuleGraph;
  /** Resolver owning provider caches and enforcing the closed-container boundary. */
  readonly resolver: InstanceResolver;
  /** Coordinator retaining default instances for startup and shutdown hooks. */
  readonly lifecycle: LifecycleCoordinator;
  /** Mutable promise shared by `close` calls; `undefined` until the first call.
   * @default `undefined`.
   */
  closing: Promise<void> | undefined;
}
const CONTAINER_STATES = new WeakMap<GlacierContainer, IContainerState>();

/** Owns a validated graph and provider lifecycle; DEFAULT instances are shared, REQUEST context-scoped, TRANSIENT per resolution. */
export class GlacierContainer {
  /** Reads container internals and rejects receivers not initialized by this class.
   * @returns The graph, resolver, lifecycle coordinator, and shutdown promise state.
   * @throws {TypeError} The receiver is not a registered `GlacierContainer` instance.
   */
  private get state(): IContainerState {
    const state = CONTAINER_STATES.get(this);
    if (state === undefined) throw new TypeError("Invalid container receiver");
    return state;
  }

  /** Stores initialized collaborators; callers must use `create` to build a usable container.
   * @param graph Validated graph that defines provider registrations and visibility.
   * @param resolver Resolver owning scoped instances for this graph.
   * @param lifecycle Coordinator for hooks on eagerly created default instances.
   */
  private constructor(
    graph: ModuleGraph,
    resolver: InstanceResolver,
    lifecycle: LifecycleCoordinator,
  ) {
    CONTAINER_STATES.set(this, { graph, resolver, lifecycle, closing: undefined });
  }

  /** Validates the reachable graph, eagerly creates default providers, then initializes their hooks.
   * @param root Root module class or dynamic module used to compose the container.
   * @returns A ready container; rejects if graph validation or default-provider creation fails.
   * @throws {Error} Startup hooks fail; cleanup runs and its failures are included in the rejection.
   */
  public static async create(root: IModuleReference): Promise<GlacierContainer> {
    const graph = ModuleGraph.build(root);
    const resolver = new InstanceResolver(graph);
    const lifecycle = new LifecycleCoordinator(await resolver.createDefaultInstances());
    const startupFailure = await lifecycle.initialize();
    if (startupFailure !== undefined) {
      const cleanupFailures = await lifecycle.shutdown();
      throw GlacierContainer.summarize([startupFailure, ...cleanupFailures]);
    }
    return new GlacierContainer(graph, resolver, lifecycle);
  }

  /** Gets a shared default instance, searching beyond root visibility unless strict lookup is requested.
   * @param token Token identifying the provider to retrieve.
   * @param options Lookup options; `true` limits root visibility (default: `false`).
   * @template T Provider value type inferred from the injection token.
   * @returns The shared provider instance matching `token`.
   */
  public get<T>(token: InjectionToken<T>, options?: IGetOptions): T;
  /** Gets a shared default instance, searching beyond root visibility unless strict lookup is requested.
   * @param token Constructable class identifying the provider to retrieve.
   * @param options Lookup options; `true` limits root visibility (default: `false`).
   * @template T Object instance type constructed by the class token.
   * @returns The shared provider instance matching `token`.
   */
  public get<T extends object>(token: IConstructableClass<T>, options?: IGetOptions): T;
  /** Gets a shared default instance, searching beyond root visibility unless strict lookup is requested.
   * @param token Symbol identifying the provider to retrieve.
   * @param options Lookup options; `true` limits root visibility (default: `false`).
   * @returns The shared provider instance matching `token`.
   */
  public get(token: symbol, options?: IGetOptions): unknown;
  /** Gets a shared default instance, searching beyond root visibility unless strict lookup is requested.
   * @param token Token reference identifying the provider to retrieve.
   * @param options Lookup options; `true` limits root visibility (default: `false`).
   * @returns The shared provider instance matching `token`.
   */
  public get(token: ITokenReference, options: IGetOptions = {}): unknown {
    return this.state.resolver.get(token, this.state.graph.root, options.strict ?? false);
  }

  /** Resolves by scope: DEFAULT is shared, REQUEST context-shared, TRANSIENT new; visibility follows `get`.
   * @param token Token identifying the provider to resolve.
   * @param contextId Optional `ContainerContext` id; omission creates a fresh context.
   * @param options Lookup options; `true` limits root visibility (default: `false`).
   * @returns Promise for the instance; invalid contexts or missing providers reject it.
   * @template T Provider value type inferred from the injection token.
   */
  public resolve<T>(
    token: InjectionToken<T>,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<T>;
  /** Resolves by scope: DEFAULT is shared, REQUEST context-shared, TRANSIENT new; visibility follows `get`.
   * @param token Constructable class identifying the provider to resolve.
   * @param contextId Optional `ContainerContext` id; omission creates a fresh context.
   * @param options Lookup options; `true` limits root visibility (default: `false`).
   * @returns Promise for the instance; invalid contexts or missing providers reject it.
   * @template T Object instance type constructed by the class token.
   */
  public resolve<T extends object>(
    token: IConstructableClass<T>,
    contextId?: ContextId,
    options?: IGetOptions,
  ): Promise<T>;
  /** Resolves by scope: DEFAULT is shared, REQUEST context-shared, TRANSIENT new; visibility follows `get`.
   * @param token Symbol identifying the provider to resolve.
   * @param contextId Optional `ContainerContext` id; omission creates a fresh context.
   * @param options Lookup options; `true` limits root visibility (default: `false`).
   * @returns Promise for the instance; invalid contexts or missing providers reject it.
   */
  public resolve(token: symbol, contextId?: ContextId, options?: IGetOptions): Promise<unknown>;
  /** Resolves by scope: DEFAULT is shared, REQUEST context-shared, TRANSIENT new; visibility follows `get`.
   * @param token Token reference identifying the provider to resolve.
   * @param contextId Optional `ContainerContext` id; omission creates a fresh context.
   * @param options Lookup options; `true` limits root visibility (default: `false`).
   * @returns Promise for the instance; invalid contexts or missing providers reject it.
   */
  public resolve(
    token: ITokenReference,
    contextId?: ContextId,
    options: IGetOptions = {},
  ): Promise<unknown> {
    return this.state.resolver.resolve(
      token,
      this.state.graph.root,
      options.strict ?? false,
      contextId,
    );
  }

  /** Creates a lookup view whose default visibility is restricted to one reachable module.
   * @param module Module class or dynamic module reference to select.
   * @returns A module-bound lookup sharing this container's resolver.
   */
  public select(module: IModuleReference): ModuleLookup {
    this.state.resolver.assertOpen("select a module");
    return new ModuleLookup(this.state.resolver, this.state.graph.select(module));
  }

  /** Closes the container once and shares the same shutdown result with repeated callers.
   * @returns A promise fulfilled after all shutdown hooks finish, or rejected with hook failures.
   */
  public close(): Promise<void> {
    this.state.closing ??= this.shutDown();
    return this.state.closing;
  }

  /** Closes lookup access, runs all shutdown hooks, and aggregates any hook failures.
   * @returns A promise fulfilled when shutdown succeeds; otherwise it rejects with collected failures.
   * @throws {Error} One or more shutdown hooks fail; the rejection reports their failures.
   */
  private async shutDown(): Promise<void> {
    this.state.resolver.close();
    const failures = await this.state.lifecycle.shutdown();
    if (failures.length > 0) throw GlacierContainer.summarize(failures);
  }

  /** Preserves one lifecycle failure or groups multiple failures into an aggregate error.
   * @param failures Lifecycle hook failures in the order they occurred.
   * @returns The original error when singular, otherwise an aggregate containing all failures.
   */
  private static summarize(failures: readonly LifecycleHookError[]): Error {
    const [only] = failures;
    if (failures.length === 1 && only !== undefined) return only;
    return new AggregateContainerError(failures);
  }
}
