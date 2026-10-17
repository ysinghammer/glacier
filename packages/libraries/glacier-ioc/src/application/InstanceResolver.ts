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
   * search over every module. Throws `UnknownDependencyError` when no provider is found; dependencies of
   * found providers were validated when the graph was built.
   */
  public get(token: ITokenReference, module: ModuleNode, isStrict: boolean): unknown {
    return this.#resolve(this.#locate(token, module, isStrict));
  }

  /** Finds the registration for a token or throws `UnknownDependencyError`. */
  #locate(token: ITokenReference, module: ModuleNode, isStrict: boolean): IProviderRegistration {
    const visible = this.#graph.findVisible(module, token);
    const registration = visible ?? (isStrict ? undefined : this.#graph.findAnywhere(token));
    if (registration === undefined) throw new UnknownDependencyError([token]);
    return registration;
  }

  /** Returns the shared instance of a registration, constructing it on first use. */
  #resolve(registration: IProviderRegistration): unknown {
    if (this.#instances.has(registration)) return this.#instances.get(registration);
    const instance = this.#create(registration);
    this.#instances.set(registration, instance);
    return instance;
  }

  /** Resolves one validated dependency from the owning module's point of view. */
  #resolveToken(token: ITokenReference, owner: ModuleNode): unknown {
    return this.#resolve(this.#locate(token, owner, true));
  }

  /** Produces the value of one provider according to its kind. */
  #create(registration: IProviderRegistration): unknown {
    const { provider, module } = registration;
    if ("useValue" in provider) return provider.useValue;
    if ("useExisting" in provider) return this.#resolveToken(provider.useExisting, module);
    if ("useFactory" in provider) {
      const injected = (provider.inject ?? []).map((token) => this.#resolveToken(token, module));
      return provider.useFactory(...(injected as never[]));
    }
    const dependencies = InjectionMetadata.readDependencies(provider.useClass);
    const injected = dependencies.map((dependency) => this.#resolveDependency(dependency, module));
    return new provider.useClass(...(injected as never[]));
  }

  /** Resolves one constructor parameter, yielding `undefined` for a missing `@Optional` dependency. */
  #resolveDependency(dependency: IConstructorDependency, owner: ModuleNode): unknown {
    const isMissing = this.#graph.findVisible(owner, dependency.token) === undefined;
    if (dependency.isOptional && isMissing) return undefined;
    return this.#resolveToken(dependency.token, owner);
  }
}
