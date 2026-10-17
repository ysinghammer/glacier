import type { IConstructableClass } from "@glacier/reflection";
import { ModuleGraph } from "../domain/modules/ModuleGraph.js";
import type { IModuleReference } from "../domain/modules/IModuleReference.js";
import type { InjectionToken } from "../domain/tokens/InjectionToken.js";
import type { ITokenReference } from "../domain/tokens/ITokenReference.js";
import type { IGetOptions } from "./IGetOptions.js";
import { InstanceResolver } from "./InstanceResolver.js";
import { ModuleLookup } from "./ModuleLookup.js";

/**
 * Dependency-injection container over a module graph resolving DEFAULT-scope providers: each provider is
 * constructed at most once and shared by every dependent and every `get`. The graph is validated eagerly in
 * `create`; dependency resolution happens lazily on first use.
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
   * and validating module metadata, provider shapes, class metadata, scopes and exports up front.
   * Throws one `AggregateContainerError` listing every problem found; nothing is constructed.
   */
  public static create(root: IModuleReference): GlacierContainer {
    return new GlacierContainer(ModuleGraph.build(root));
  }

  /**
   * Returns the shared instance for the token, constructing it and its dependencies on first use.
   * By default the whole container is searched, preferring what the root module sees;
   * `{ strict: true }` restricts the lookup to the root module's visibility.
   * Throws `UnknownDependencyError` (with the path from the requested token) when a dependency has no
   * visible provider and is not `@Optional`, and `CircularDependencyError` when providers depend on each other.
   */
  public get<T>(token: InjectionToken<T>, options?: IGetOptions): T;
  public get<T extends object>(token: IConstructableClass<T>, options?: IGetOptions): T;
  public get(token: symbol, options?: IGetOptions): unknown;
  public get(token: ITokenReference, options: IGetOptions = {}): unknown {
    return this.#resolver.get(token, this.#graph.root, options.strict ?? false);
  }

  /**
   * Returns a view restricted to one module of the container, given as its class or dynamic module.
   * Throws `InvalidModuleError` when the module is not reachable from the root.
   */
  public select(module: IModuleReference): ModuleLookup {
    return new ModuleLookup(this.#resolver, this.#graph.select(module));
  }
}
