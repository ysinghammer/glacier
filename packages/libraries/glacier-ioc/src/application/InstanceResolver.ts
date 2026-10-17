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
  readonly #instances = new Map<IProviderRegistration, unknown>();
  readonly #requestInstances = new WeakMap<ContextId, Map<IProviderRegistration, unknown>>();

  /** Creates a resolver over a validated graph; nothing is constructed until the first lookup. */
  public constructor(graph: ModuleGraph) {
    this.#graph = graph;
  }

  /**
   * Returns the shared instance of the token as seen from `module`; when not `strict`, falls back to a
   * search over every module. Throws `UnknownDependencyError` when no provider is found and
   * `InvalidScopeError` when the provider is TRANSIENT or REQUEST-bound, which only `resolve` can serve.
   */
  public get(token: ITokenReference, module: ModuleNode, isStrict: boolean): unknown {
    const registration = this.#locate(token, module, isStrict);
    if (this.#graph.profileOf(registration).lifetime !== "default") {
      throw new InvalidScopeError(
        [token],
        "the provider is not DEFAULT-scoped, so it needs a context; use resolve() instead of get()",
      );
    }
    return this.#resolve(registration, ContainerContext.createContextId());
  }

  /**
   * Resolves the token as seen from `module` for a context: REQUEST providers are shared within the context,
   * TRANSIENT ones are created anew, DEFAULT ones are the shared singletons. A missing context id means a
   * fresh context. Rejects with `ContextIdMisuseError` for an invalid id and `UnknownDependencyError` when
   * no provider is found.
   */
  public async resolve(
    token: ITokenReference,
    module: ModuleNode,
    isStrict: boolean,
    contextId: unknown,
  ): Promise<unknown> {
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

  /** Returns the instance of a registration according to its effective scope. */
  #resolve(registration: IProviderRegistration, context: ContextId): unknown {
    const { lifetime } = this.#graph.profileOf(registration);
    if (lifetime === "transient") return this.#create(registration, context);
    const cache = lifetime === "request" ? this.#requestCache(context) : this.#instances;
    if (cache.has(registration)) return cache.get(registration);
    const instance = this.#create(registration, context);
    cache.set(registration, instance);
    return instance;
  }

  /** Returns the instances created so far for one context. */
  #requestCache(context: ContextId): Map<IProviderRegistration, unknown> {
    const known = this.#requestInstances.get(context);
    if (known !== undefined) return known;
    const created = new Map<IProviderRegistration, unknown>();
    this.#requestInstances.set(context, created);
    return created;
  }

  /** Resolves one validated dependency from the owning module's point of view. */
  #resolveToken(token: ITokenReference, owner: ModuleNode, context: ContextId): unknown {
    return this.#resolve(this.#locate(token, owner, true), context);
  }

  /** Produces the value of one provider according to its kind. */
  #create(registration: IProviderRegistration, context: ContextId): unknown {
    const { provider, module } = registration;
    if (provider === ModuleRef.PROVIDER) return new ModuleLookup(this, module);
    if ("useValue" in provider) return provider.useValue;
    if ("useExisting" in provider) return this.#resolveToken(provider.useExisting, module, context);
    if ("useFactory" in provider) {
      const injected = (provider.inject ?? []).map((token) =>
        this.#resolveToken(token, module, context),
      );
      return provider.useFactory(...(injected as never[]));
    }
    const dependencies = InjectionMetadata.readDependencies(provider.useClass);
    const injected = dependencies.map((dependency) =>
      this.#resolveDependency(dependency, module, context),
    );
    return new provider.useClass(...(injected as never[]));
  }

  /** Resolves one constructor parameter, yielding `undefined` for a missing `@Optional` dependency. */
  #resolveDependency(
    dependency: IConstructorDependency,
    owner: ModuleNode,
    context: ContextId,
  ): unknown {
    const isMissing = this.#graph.findVisible(owner, dependency.token) === undefined;
    if (dependency.isOptional && isMissing) return undefined;
    return this.#resolveToken(dependency.token, owner, context);
  }
}
