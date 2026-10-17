import type { IConstructableClass } from "@glacier/reflection";
import { AggregateContainerError } from "../domain/failures/AggregateContainer.error.js";
import { CircularDependencyError } from "../domain/failures/CircularDependency.error.js";
import { InvalidScopeError } from "../domain/failures/InvalidScope.error.js";
import { UnknownDependencyError } from "../domain/failures/UnknownDependency.error.js";
import type { IConstructorDependency } from "../domain/metadata/IConstructorDependency.js";
import { InjectionMetadata } from "../domain/metadata/InjectionMetadata.js";
import type { IClassConstructor } from "../domain/providers/IClassConstructor.js";
import type { INormalizedProvider } from "../domain/providers/INormalizedProvider.js";
import { ProviderNormalization } from "../domain/providers/ProviderNormalization.js";
import { InjectionToken } from "../domain/tokens/InjectionToken.js";
import type { IToken } from "../domain/tokens/IToken.js";
import type { ITokenReference } from "../domain/tokens/ITokenReference.js";
import type { IContainerRoot } from "./IContainerRoot.js";

/**
 * Dependency-injection container resolving DEFAULT-scope providers: each token is constructed at most once
 * and the same instance is shared by every dependent and every `get`. Providers are validated eagerly in
 * `create`; dependency resolution happens lazily on first use.
 */
export class GlacierContainer {
  readonly #providers: ReadonlyMap<IToken, INormalizedProvider>;
  readonly #instances = new Map<IToken, unknown>();

  private constructor(providers: ReadonlyMap<IToken, INormalizedProvider>) {
    this.#providers = providers;
  }

  /**
   * Builds a container from the root's providers, validating every provider shape, class metadata and
   * scope up front. Throws one `AggregateContainerError` listing every `InvalidProviderError` or
   * `InvalidScopeError` found; nothing is constructed.
   */
  public static create(root: IContainerRoot): GlacierContainer {
    const providers = new Map<IToken, INormalizedProvider>();
    const problems: Error[] = [];
    root.providers.forEach((candidate, position) => {
      try {
        const provider = ProviderNormalization.normalize(candidate, position);
        if ("useClass" in provider) {
          GlacierContainer.#inspectClass(provider.provide, provider.useClass);
        }
        providers.set(GlacierContainer.#identity(provider.provide), provider);
      } catch (error) {
        // Normalization and metadata reading only throw ContainerError subclasses, which are collected.
        problems.push(error as Error);
      }
    });
    if (problems.length > 0) throw new AggregateContainerError(problems);
    return new GlacierContainer(providers);
  }

  /**
   * Returns the shared instance for the token, constructing it and its dependencies on first use.
   * Throws `UnknownDependencyError` (with the path from the requested token) when a dependency has no
   * provider and is not `@Optional`, and `CircularDependencyError` when providers depend on each other.
   */
  public get<T>(token: InjectionToken<T>): T;
  public get<T extends object>(token: IConstructableClass<T>): T;
  public get(token: symbol): unknown;
  public get(token: ITokenReference): unknown {
    return this.#resolve(token, []);
  }

  /** Checks a class provider's constructor metadata and scope so resolution can read them without failing. */
  static #inspectClass(provide: ITokenReference, implementation: IClassConstructor): void {
    InjectionMetadata.readDependencies(implementation);
    const scope = InjectionMetadata.readScope(implementation);
    if (scope !== "default") {
      throw new InvalidScopeError([provide], `scope "${scope}" is not supported yet`);
    }
  }

  /** Typed injection tokens are keyed by their symbol; classes and symbols are keyed as themselves. */
  static #identity(token: ITokenReference): IToken {
    return token instanceof InjectionToken ? token.symbol : token;
  }

  /** Resolves a token to its shared instance; `path` lists the tokens currently being resolved. */
  #resolve(token: ITokenReference, path: readonly ITokenReference[]): unknown {
    const identity = GlacierContainer.#identity(token);
    const currentPath = [...path, token];
    if (path.some((visited) => GlacierContainer.#identity(visited) === identity)) {
      throw new CircularDependencyError(currentPath);
    }
    if (this.#instances.has(identity)) return this.#instances.get(identity);
    const provider = this.#providers.get(identity);
    if (provider === undefined) throw new UnknownDependencyError(currentPath);
    const instance = this.#create(provider, currentPath);
    this.#instances.set(identity, instance);
    return instance;
  }

  /** Produces the value of one provider according to its kind. */
  #create(provider: INormalizedProvider, path: readonly ITokenReference[]): unknown {
    if ("useValue" in provider) return provider.useValue;
    if ("useExisting" in provider) return this.#resolve(provider.useExisting, path);
    if ("useFactory" in provider) {
      const injected = (provider.inject ?? []).map((token) => this.#resolve(token, path));
      return provider.useFactory(...(injected as never[]));
    }
    const dependencies = InjectionMetadata.readDependencies(provider.useClass);
    const injected = dependencies.map((dependency) => this.#resolveDependency(dependency, path));
    return new provider.useClass(...(injected as never[]));
  }

  /** Resolves one constructor parameter, yielding `undefined` for a missing `@Optional` dependency. */
  #resolveDependency(
    dependency: IConstructorDependency,
    path: readonly ITokenReference[],
  ): unknown {
    if (dependency.isOptional && !this.#providers.has(dependency.token)) return undefined;
    return this.#resolve(dependency.token, path);
  }
}
