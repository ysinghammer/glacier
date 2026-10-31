import { ProviderCreationError } from "../../domain/dependencyInjection/errors/ProviderCreation.error.js";
import { UseAfterCloseError } from "../../domain/dependencyInjection/errors/UseAfterClose.error.js";
import { LifecycleHooks } from "../../domain/dependencyInjection/lifecycle/LifecycleHooks.js";
import { InvalidScopeError } from "../../domain/dependencyInjection/errors/InvalidScope.error.js";
import { UnknownDependencyError } from "../../domain/dependencyInjection/errors/UnknownDependency.error.js";
import type { IConstructorDependency } from "../../domain/dependencyInjection/metadata/types/IConstructorDependency.js";
import { InjectionMetadata } from "../../domain/dependencyInjection/metadata/InjectionMetadata.js";
import type { IProviderRegistration } from "../../domain/dependencyInjection/modules/types/IProviderRegistration.js";
import type { ModuleGraph } from "../../domain/dependencyInjection/modules/ModuleGraph.js";
import type { ModuleNode } from "../../domain/dependencyInjection/modules/ModuleNode.js";
import type { ITokenReference } from "../../domain/dependencyInjection/tokens/types/ITokenReference.js";
import { ContainerContext } from "../../domain/dependencyInjection/scopes/ContainerContext.js";
import type { ContextId } from "../../domain/dependencyInjection/scopes/ContextId.js";
import { ContextIds } from "../../domain/dependencyInjection/scopes/ContextIds.js";
import { ModuleRef } from "../../domain/dependencyInjection/scopes/ModuleRef.js";
import { ModuleLookup } from "./ModuleLookup.js";

/** Resolves graph providers by effective scope and resolves dependencies from each registration's module. */
export class InstanceResolver {
  /** Validated graph that owns registrations, visibility, profiles, and dependency order. */
  private readonly graph: ModuleGraph;
  /** In-flight or fulfilled promises for shared DEFAULT registrations.
   * @default Empty map.
   */
  private readonly instances = new Map<IProviderRegistration, Promise<unknown>>();
  /** Fulfilled DEFAULT instances available to synchronous `get` calls.
   * @default Empty map.
   */
  private readonly createdDefaults = new Map<IProviderRegistration, unknown>();
  /** Per-context promise caches for REQUEST registrations.
   * @default Empty weak map.
   */
  private readonly requestInstances = new WeakMap<
    ContextId,
    Map<IProviderRegistration, Promise<unknown>>
  >();
  /** Whether further resolution is forbidden; becomes `true` after `close`.
   * @default `false`.
   */
  private isClosed = false;

  /** Creates a resolver over a validated graph without constructing providers.
   * @param graph Graph whose registrations this resolver serves.
   */
  public constructor(graph: ModuleGraph) {
    this.graph = graph;
  }

  /** Marks the resolver closed; repeated calls leave it closed.
   * @returns No value; prevents later operations from resolving providers.
   */
  public close(): void {
    this.isClosed = true;
  }

  /** Checks whether resolution remains open for a named operation.
   * @param operation Description used in the closure error if the resolver is closed.
   * @returns No value when the resolver remains open.
   * @throws {UseAfterCloseError} The resolver is closed and the operation is attempted.
   */
  public assertOpen(operation: string): void {
    if (this.isClosed) throw new UseAfterCloseError(operation);
  }

  /** Creates DEFAULT providers in dependency order, awaiting each before its dependents.
   * @returns Promise for hook-capable instances in creation order; rejects if creation fails.
   */
  public async createDefaultInstances(): Promise<readonly object[]> {
    const context = ContainerContext.createContextId();
    const instances: object[] = [];
    for (const node of this.graph.dependencyOrder) {
      for (const registration of node.listRegistrations()) {
        if (this.graph.profileOf(registration).lifetime !== "default") continue;
        const instance = await this.resolveValue(registration, context);
        if (LifecycleHooks.canHaveHooks(instance) && !instances.includes(instance)) {
          instances.push(instance);
        }
      }
    }
    return instances;
  }

  /** Gets a created DEFAULT instance visible from a module, optionally searching the full graph.
   * @param token Token reference identifying the provider.
   * @param module Module whose visibility is searched first.
   * @param isStrict If `true`, do not fall back to providers outside that visibility.
   * @returns The shared instance already created for the matching DEFAULT registration.
   * @throws {InvalidScopeError} The registration is not DEFAULT-scoped.
   * @throws {InvalidScopeError} The DEFAULT instance is still being constructed.
   */
  public get(token: ITokenReference, module: ModuleNode, isStrict: boolean): unknown {
    this.assertOpen("get a provider");
    const registration = this.locate(token, module, isStrict);
    if (this.graph.profileOf(registration).lifetime !== "default") {
      throw new InvalidScopeError(
        [token],
        "the provider is not DEFAULT-scoped, so it needs a context; use resolve() instead of get()",
      );
    }
    if (!this.createdDefaults.has(registration)) {
      throw new InvalidScopeError(
        [token],
        "the provider is still being created; use resolve() inside providers",
      );
    }
    return this.createdDefaults.get(registration);
  }

  /** Resolves a visible provider according to its scope and context.
   * @param token Token reference identifying the provider.
   * @param module Module whose visibility is searched first.
   * @param isStrict If `true`, do not fall back to providers outside that visibility.
   * @param contextId Candidate context identifier; validated before provider lookup.
   * @returns Promise for the instance; rejects if context validation, lookup, or creation fails.
   */
  public async resolve(
    token: ITokenReference,
    module: ModuleNode,
    isStrict: boolean,
    contextId: unknown,
  ): Promise<unknown> {
    this.assertOpen("resolve a provider");
    const context = ContextIds.require(contextId);
    return this.resolveValue(this.locate(token, module, isStrict), context);
  }

  /** Finds a provider in the requested visibility or reports the missing token.
   * @param token Token reference to locate.
   * @param module Module whose visibility is searched first.
   * @param isStrict If `true`, do not fall back to the full graph.
   * @returns Matching provider registration.
   * @throws {UnknownDependencyError} No registration is visible under the requested search rules.
   */
  private locate(
    token: ITokenReference,
    module: ModuleNode,
    isStrict: boolean,
  ): IProviderRegistration {
    const visible = this.graph.findVisible(module, token);
    const registration = visible ?? (isStrict ? undefined : this.graph.findAnywhere(token));
    if (registration === undefined) throw new UnknownDependencyError([token]);
    return registration;
  }

  /** Returns the lifetime-specific promise: DEFAULT shared, REQUEST per context, TRANSIENT new each time.
   * @param registration Provider registration whose effective lifetime controls caching.
   * @param context Context used for REQUEST-scoped caching and dependency resolution.
   * @returns The provider promise; TRANSIENT registrations receive a new creation each call.
   */
  private resolveValue(registration: IProviderRegistration, context: ContextId): Promise<unknown> {
    const { lifetime } = this.graph.profileOf(registration);
    if (lifetime === "transient") return this.create(registration, context);
    const cache = lifetime === "request" ? this.requestCache(context) : this.instances;
    const known = cache.get(registration);
    if (known !== undefined) return known;
    const created = this.create(registration, context);
    cache.set(registration, created);
    if (lifetime === "default") {
      return created.then((instance) => {
        this.createdDefaults.set(registration, instance);
        return instance;
      });
    }
    return created;
  }

  /** Gets or creates the REQUEST cache for one context.
   * @param context Context whose cache is requested.
   * @returns The mutable registration cache owned by that context.
   */
  private requestCache(context: ContextId): Map<IProviderRegistration, Promise<unknown>> {
    const known = this.requestInstances.get(context);
    if (known !== undefined) return known;
    const created = new Map<IProviderRegistration, Promise<unknown>>();
    this.requestInstances.set(context, created);
    return created;
  }

  /** Resolves a dependency using its owning module's strict visibility.
   * @param token Dependency token to resolve.
   * @param owner Module that registered the dependent provider.
   * @param context Context shared with the dependent provider.
   * @returns A promise for the dependency instance.
   */
  private resolveToken(
    token: ITokenReference,
    owner: ModuleNode,
    context: ContextId,
  ): Promise<unknown> {
    return this.resolveValue(this.locate(token, owner, true), context);
  }

  /** Constructs or supplies one provider value according to its registration kind.
   * @param registration Provider and owning module being instantiated.
   * @param context Context shared by the provider and its dependencies.
   * @returns The supplied or constructed provider value after asynchronous work completes.
   * @throws {ProviderCreationError} Factory failure makes this async method's promise reject.
   */
  private async create(registration: IProviderRegistration, context: ContextId): Promise<unknown> {
    const { provider, module } = registration;
    if (provider === ModuleRef.PROVIDER) return new ModuleLookup(this, module);
    if ("useValue" in provider) return provider.useValue;
    if ("useExisting" in provider) return this.resolveToken(provider.useExisting, module, context);
    if ("useFactory" in provider) {
      const injected = await this.resolveAll(provider.inject ?? [], module, context);
      try {
        return await provider.useFactory(...(injected as never[]));
      } catch (cause) {
        throw new ProviderCreationError(provider.provide, cause);
      }
    }
    const dependencies = InjectionMetadata.readDependencies(provider.useClass);
    const injected: unknown[] = [];
    for (const dependency of dependencies) {
      injected.push(await this.resolveDependency(dependency, module, context));
    }
    return new provider.useClass(...(injected as never[]));
  }

  /** Resolves provider dependencies sequentially in declaration order.
   * @param tokens Dependency tokens to resolve.
   * @param owner Module that registered the provider needing these dependencies.
   * @param context Context shared by all resolved dependencies.
   * @returns A promise for dependency values in the same order as `tokens`.
   */
  private async resolveAll(
    tokens: readonly ITokenReference[],
    owner: ModuleNode,
    context: ContextId,
  ): Promise<unknown[]> {
    const injected: unknown[] = [];
    for (const token of tokens) injected.push(await this.resolveToken(token, owner, context));
    return injected;
  }

  /** Resolves a constructor dependency, honoring optionality only when no visible provider exists.
   * @param dependency Constructor dependency metadata, including token and optional status.
   * @param owner Module that registered the dependent class.
   * @param context Context shared with the dependent instance.
   * @returns A promise for the dependency value, or `undefined` for a missing optional dependency.
   */
  private async resolveDependency(
    dependency: IConstructorDependency,
    owner: ModuleNode,
    context: ContextId,
  ): Promise<unknown> {
    const isMissing = this.graph.findVisible(owner, dependency.token) === undefined;
    if (dependency.isOptional && isMissing) return undefined;
    return this.resolveToken(dependency.token, owner, context);
  }
}
