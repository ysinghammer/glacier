import { ProviderCreationError } from "../domain/failures/ProviderCreation.error.js";
import { UseAfterCloseError } from "../domain/failures/UseAfterClose.error.js";
import { LifecycleHooks } from "../domain/lifecycle/LifecycleHooks.js";
import { InvalidScopeError } from "../domain/failures/InvalidScope.error.js";
import { UnknownDependencyError } from "../domain/failures/UnknownDependency.error.js";
import type { IConstructorDependency } from "../domain/metadata/IConstructorDependency.js";
import { InjectionMetadata } from "../domain/metadata/InjectionMetadata.js";
import type { IProviderRegistration } from "../domain/modules/IProviderRegistration.js";
import type { ModuleGraph } from "../domain/modules/ModuleGraph.js";
import type { ModuleNode } from "../domain/modules/ModuleNode.js";
import type { ITokenReference } from "../domain/tokens/ITokenReference.js";
import { ContainerContext } from "../domain/scopes/ContainerContext.js";
import type { ContextId } from "../domain/scopes/ContextId.js";
import { ContextIds } from "../domain/scopes/ContextIds.js";
import { ModuleRef } from "../domain/scopes/ModuleRef.js";
import { ModuleLookup } from "./ModuleLookup.js";

/**
 * Resolves the providers of a module graph by effective scope: DEFAULT registrations are constructed at
 * most once and shared, REQUEST registrations once per context id, TRANSIENT ones on every resolution.
 * Dependencies are resolved from the owning module's point of view, in the same context.
 */
export class InstanceResolver {
  readonly #graph: ModuleGraph;
  readonly #instances = new Map<IProviderRegistration, Promise<unknown>>();
  readonly #createdDefaults = new Map<IProviderRegistration, unknown>();
  readonly #requestInstances = new WeakMap<
    ContextId,
    Map<IProviderRegistration, Promise<unknown>>
  >();
  #isClosed = false;

  /** Creates a resolver over a validated graph; nothing is constructed until the first lookup. */
  public constructor(graph: ModuleGraph) {
    this.#graph = graph;
  }

  /** Marks the resolver closed; every later lookup is rejected with `UseAfterCloseError`. */
  public close(): void {
    this.#isClosed = true;
  }

  /** Throws `UseAfterCloseError` naming the attempted operation once the resolver is closed. */
  public assertOpen(operation: string): void {
    if (this.#isClosed) throw new UseAfterCloseError(operation);
  }

  /**
   * Creates every DEFAULT-scope instance, one after another in module dependency order so async factories
   * finish before their dependents are constructed. Returns the distinct instances that can carry
   * lifecycle hooks in that order; rejects with the first creation failure.
   */
  public async createDefaultInstances(): Promise<readonly object[]> {
    const context = ContainerContext.createContextId();
    const instances: object[] = [];
    for (const node of this.#graph.dependencyOrder) {
      for (const registration of node.listRegistrations()) {
        if (this.#graph.profileOf(registration).lifetime !== "default") continue;
        const instance = await this.#resolve(registration, context);
        if (LifecycleHooks.canHaveHooks(instance) && !instances.includes(instance)) {
          instances.push(instance);
        }
      }
    }
    return instances;
  }

  /**
   * Returns the shared instance of the token as seen from `module`; when not `strict`, falls back to a
   * search over every module. Throws `UseAfterCloseError` after close, `UnknownDependencyError` when no
   * provider is found and `InvalidScopeError` when the provider is TRANSIENT or REQUEST-bound, which only
   * `resolve` can serve, or is still being created, which only happens inside a provider during `create`.
   */
  public get(token: ITokenReference, module: ModuleNode, isStrict: boolean): unknown {
    this.assertOpen("get a provider");
    const registration = this.#locate(token, module, isStrict);
    if (this.#graph.profileOf(registration).lifetime !== "default") {
      throw new InvalidScopeError(
        [token],
        "the provider is not DEFAULT-scoped, so it needs a context; use resolve() instead of get()",
      );
    }
    if (!this.#createdDefaults.has(registration)) {
      throw new InvalidScopeError(
        [token],
        "the provider is still being created; use resolve() inside providers",
      );
    }
    return this.#createdDefaults.get(registration);
  }

  /**
   * Resolves the token as seen from `module` for a context: REQUEST providers are shared within the context,
   * TRANSIENT ones are created anew, DEFAULT ones are the shared singletons. A missing context id means a
   * fresh context. Rejects with `UseAfterCloseError` after close, `ContextIdMisuseError` for an invalid id,
   * `UnknownDependencyError` when no provider is found and `ProviderCreationError` when a factory fails.
   */
  public async resolve(
    token: ITokenReference,
    module: ModuleNode,
    isStrict: boolean,
    contextId: unknown,
  ): Promise<unknown> {
    this.assertOpen("resolve a provider");
    const context = ContextIds.require(contextId);
    return this.#resolve(this.#locate(token, module, isStrict), context);
  }

  /** Finds the registration for a token or throws `UnknownDependencyError`. */
  #locate(token: ITokenReference, module: ModuleNode, isStrict: boolean): IProviderRegistration {
    const visible = this.#graph.findVisible(module, token);
    const registration = visible ?? (isStrict ? undefined : this.#graph.findAnywhere(token));
    if (registration === undefined) throw new UnknownDependencyError([token]);
    return registration;
  }

  /** Returns the instance of a registration according to its effective scope; concurrent callers share one creation. */
  #resolve(registration: IProviderRegistration, context: ContextId): Promise<unknown> {
    const { lifetime } = this.#graph.profileOf(registration);
    if (lifetime === "transient") return this.#create(registration, context);
    const cache = lifetime === "request" ? this.#requestCache(context) : this.#instances;
    const known = cache.get(registration);
    if (known !== undefined) return known;
    const created = this.#create(registration, context);
    cache.set(registration, created);
    if (lifetime === "default") {
      return created.then((instance) => {
        this.#createdDefaults.set(registration, instance);
        return instance;
      });
    }
    return created;
  }

  /** Returns the instances created so far for one context. */
  #requestCache(context: ContextId): Map<IProviderRegistration, Promise<unknown>> {
    const known = this.#requestInstances.get(context);
    if (known !== undefined) return known;
    const created = new Map<IProviderRegistration, Promise<unknown>>();
    this.#requestInstances.set(context, created);
    return created;
  }

  /** Resolves one validated dependency from the owning module's point of view. */
  #resolveToken(token: ITokenReference, owner: ModuleNode, context: ContextId): Promise<unknown> {
    return this.#resolve(this.#locate(token, owner, true), context);
  }

  /** Produces the value of one provider according to its kind, awaiting dependencies and async factories. */
  async #create(registration: IProviderRegistration, context: ContextId): Promise<unknown> {
    const { provider, module } = registration;
    if (provider === ModuleRef.PROVIDER) return new ModuleLookup(this, module);
    if ("useValue" in provider) return provider.useValue;
    if ("useExisting" in provider) return this.#resolveToken(provider.useExisting, module, context);
    if ("useFactory" in provider) {
      const injected = await this.#resolveAll(provider.inject ?? [], module, context);
      try {
        return await provider.useFactory(...(injected as never[]));
      } catch (cause) {
        throw new ProviderCreationError(provider.provide, cause);
      }
    }
    const dependencies = InjectionMetadata.readDependencies(provider.useClass);
    const injected: unknown[] = [];
    for (const dependency of dependencies) {
      injected.push(await this.#resolveDependency(dependency, module, context));
    }
    return new provider.useClass(...(injected as never[]));
  }

  /** Resolves tokens one after another so dependencies are created in declaration order. */
  async #resolveAll(
    tokens: readonly ITokenReference[],
    owner: ModuleNode,
    context: ContextId,
  ): Promise<unknown[]> {
    const injected: unknown[] = [];
    for (const token of tokens) injected.push(await this.#resolveToken(token, owner, context));
    return injected;
  }

  /** Resolves one constructor parameter, yielding `undefined` for a missing `@Optional` dependency. */
  async #resolveDependency(
    dependency: IConstructorDependency,
    owner: ModuleNode,
    context: ContextId,
  ): Promise<unknown> {
    const isMissing = this.#graph.findVisible(owner, dependency.token) === undefined;
    if (dependency.isOptional && isMissing) return undefined;
    return this.#resolveToken(dependency.token, owner, context);
  }
}
