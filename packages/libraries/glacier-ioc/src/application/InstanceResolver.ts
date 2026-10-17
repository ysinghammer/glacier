import { CircularDependencyError } from "../domain/failures/CircularDependency.error.js";
import { UnknownDependencyError } from "../domain/failures/UnknownDependency.error.js";
import type { IConstructorDependency } from "../domain/metadata/IConstructorDependency.js";
import { InjectionMetadata } from "../domain/metadata/InjectionMetadata.js";
import type { IProviderRegistration } from "../domain/modules/IProviderRegistration.js";
import type { ModuleGraph } from "../domain/modules/ModuleGraph.js";
import type { ModuleNode } from "../domain/modules/ModuleNode.js";
import type { ITokenReference } from "../domain/tokens/ITokenReference.js";

/**
 * Resolves DEFAULT-scope providers of a module graph: each registration is constructed at most once and
 * shared by every dependent. Dependencies are resolved from the owning module's point of view.
 */
export class InstanceResolver {
  readonly #graph: ModuleGraph;
  readonly #instances = new Map<IProviderRegistration, unknown>();

  /** Creates a resolver over a validated graph; nothing is constructed until the first `get`. */
  public constructor(graph: ModuleGraph) {
    this.#graph = graph;
  }

  /**
   * Returns the shared instance of the token as seen from `module`; when not `strict`, falls back to a
   * search over every module. Throws `UnknownDependencyError` when no provider is found and
   * `CircularDependencyError` when providers depend on each other.
   */
  public get(token: ITokenReference, module: ModuleNode, isStrict: boolean): unknown {
    const visible = this.#graph.findVisible(module, token);
    const registration = visible ?? (isStrict ? undefined : this.#graph.findAnywhere(token));
    if (registration === undefined) throw new UnknownDependencyError([token]);
    return this.#resolve(registration, [token], []);
  }

  /** Resolves a registration; `path` shows the tokens being resolved and `active` guards cycles. */
  #resolve(
    registration: IProviderRegistration,
    path: readonly ITokenReference[],
    active: readonly IProviderRegistration[],
  ): unknown {
    if (active.includes(registration)) throw new CircularDependencyError(path);
    if (this.#instances.has(registration)) return this.#instances.get(registration);
    const instance = this.#create(registration, path, [...active, registration]);
    this.#instances.set(registration, instance);
    return instance;
  }

  /** Resolves one dependency of a registration from the owning module's point of view. */
  #resolveToken(
    token: ITokenReference,
    owner: ModuleNode,
    path: readonly ITokenReference[],
    active: readonly IProviderRegistration[],
  ): unknown {
    const currentPath = [...path, token];
    const registration = this.#graph.findVisible(owner, token);
    if (registration === undefined) throw new UnknownDependencyError(currentPath);
    return this.#resolve(registration, currentPath, active);
  }

  /** Produces the value of one provider according to its kind. */
  #create(
    registration: IProviderRegistration,
    path: readonly ITokenReference[],
    active: readonly IProviderRegistration[],
  ): unknown {
    const { provider, module } = registration;
    if ("useValue" in provider) return provider.useValue;
    if ("useExisting" in provider) {
      return this.#resolveToken(provider.useExisting, module, path, active);
    }
    if ("useFactory" in provider) {
      const injected = (provider.inject ?? []).map((token) =>
        this.#resolveToken(token, module, path, active),
      );
      return provider.useFactory(...(injected as never[]));
    }
    const dependencies = InjectionMetadata.readDependencies(provider.useClass);
    const injected = dependencies.map((dependency) =>
      this.#resolveDependency(dependency, module, path, active),
    );
    return new provider.useClass(...(injected as never[]));
  }

  /** Resolves one constructor parameter, yielding `undefined` for a missing `@Optional` dependency. */
  #resolveDependency(
    dependency: IConstructorDependency,
    owner: ModuleNode,
    path: readonly ITokenReference[],
    active: readonly IProviderRegistration[],
  ): unknown {
    const isMissing = this.#graph.findVisible(owner, dependency.token) === undefined;
    if (dependency.isOptional && isMissing) return undefined;
    return this.#resolveToken(dependency.token, owner, path, active);
  }
}
