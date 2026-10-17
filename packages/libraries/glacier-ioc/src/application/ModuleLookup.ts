import type { IConstructableClass } from "@glacier/reflection";
import type { ModuleNode } from "../domain/modules/ModuleNode.js";
import type { InjectionToken } from "../domain/tokens/InjectionToken.js";
import type { ITokenReference } from "../domain/tokens/ITokenReference.js";
import type { IGetOptions } from "./IGetOptions.js";
import type { InstanceResolver } from "./InstanceResolver.js";

/** The container as seen from one selected module; lookups are strict unless `{ strict: false }` is given. */
export class ModuleLookup {
  readonly #resolver: InstanceResolver;
  readonly #module: ModuleNode;

  /** Wraps the resolver for one module; created by `GlacierContainer.select`. */
  public constructor(resolver: InstanceResolver, module: ModuleNode) {
    this.#resolver = resolver;
    this.#module = module;
  }

  /**
   * Returns the shared instance of the token as visible to the selected module (own providers, imports'
   * exports, global exports). `{ strict: false }` also searches every other module of the container.
   * Throws `UnknownDependencyError` when nothing matches and `CircularDependencyError` for cycles.
   */
  public get<T>(token: InjectionToken<T>, options?: IGetOptions): T;
  public get<T extends object>(token: IConstructableClass<T>, options?: IGetOptions): T;
  public get(token: symbol, options?: IGetOptions): unknown;
  public get(token: ITokenReference, options: IGetOptions = {}): unknown {
    return this.#resolver.get(token, this.#module, options.strict ?? true);
  }
}
