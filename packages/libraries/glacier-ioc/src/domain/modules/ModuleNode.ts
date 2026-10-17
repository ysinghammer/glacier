import type { INormalizedProvider } from "../providers/INormalizedProvider.js";
import type { IClassConstructor } from "../providers/IClassConstructor.js";
import { TokenIdentity } from "../tokens/TokenIdentity.js";
import type { IToken } from "../tokens/IToken.js";
import type { ITokenReference } from "../tokens/ITokenReference.js";
import type { IModuleReference } from "./IModuleReference.js";
import type { IProviderRegistration } from "./IProviderRegistration.js";

/**
 * One module instance of the graph: its own providers, imported modules and export declarations.
 * Nodes are mutated only while the graph is being built; afterwards they are read-only.
 */
export class ModuleNode {
  /** The class or dynamic module this node was created from; the graph keeps one node per reference. */
  readonly reference: IModuleReference;
  /** The decorated module class. */
  readonly moduleClass: IClassConstructor;
  /** Whether the module's exports are visible container-wide. */
  readonly isGlobal: boolean;
  readonly #registrations = new Map<IToken, IProviderRegistration>();
  readonly #exportedTokens = new Map<IToken, ITokenReference>();
  readonly #reExportedModules: ModuleNode[] = [];
  readonly #imports: ModuleNode[] = [];

  /** Creates an empty node; providers, imports and exports are added while the graph is built. */
  public constructor(
    reference: IModuleReference,
    moduleClass: IClassConstructor,
    isGlobal: boolean,
  ) {
    this.reference = reference;
    this.moduleClass = moduleClass;
    this.isGlobal = isGlobal;
  }

  /** Registers an own provider; a later provider for the same token replaces an earlier one. */
  public register(token: ITokenReference, provider: INormalizedProvider): void {
    this.#registrations.set(TokenIdentity.of(token), {
      module: this,
      provider,
    });
  }

  /** Records an imported module; importing the same node twice keeps a single entry. */
  public addImport(imported: ModuleNode): void {
    if (!this.#imports.includes(imported)) this.#imports.push(imported);
  }

  /** Records an exported token. */
  public exportToken(token: ITokenReference): void {
    this.#exportedTokens.set(TokenIdentity.of(token), token);
  }

  /** Records an imported module whose exports are re-exported. */
  public reExport(imported: ModuleNode): void {
    this.#reExportedModules.push(imported);
  }

  /** Returns the imported node matching the class or dynamic module, or `undefined` when not imported. */
  public findImport(reference: IModuleReference): ModuleNode | undefined {
    return this.#imports.find(
      (imported) => imported.reference === reference || imported.moduleClass === reference,
    );
  }

  /** Returns the registration owned by this module for the token, regardless of exports. */
  public findOwn(token: ITokenReference): IProviderRegistration | undefined {
    return this.#registrations.get(TokenIdentity.of(token));
  }

  /** Lists exported tokens that are neither owned nor exported by an imported module. */
  public findUnavailableExports(): readonly ITokenReference[] {
    return [...this.#exportedTokens.entries()]
      .filter(
        ([identity, token]) => this.findOwn(token) === undefined && !this.#isImported(identity),
      )
      .map(([, token]) => token);
  }

  /**
   * Resolves what this module offers importers for the token: an exported own provider, a token exported
   * from an import, or the exports of a re-exported module. `visited` guards import cycles.
   */
  public findExported(
    token: ITokenReference,
    visited: Set<ModuleNode> = new Set(),
  ): IProviderRegistration | undefined {
    if (visited.has(this)) return undefined;
    visited.add(this);
    const own = this.findOwn(token);
    if (own !== undefined && this.#exportedTokens.has(TokenIdentity.of(token))) return own;
    const sources = this.#exportedTokens.has(TokenIdentity.of(token))
      ? this.#imports
      : this.#reExportedModules;
    for (const source of sources) {
      const found = source.findExported(token, visited);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  /** Finds the provider visible inside this module: own, then imports' exports, then global exports. */
  public findVisible(
    token: ITokenReference,
    globalModules: readonly ModuleNode[],
  ): IProviderRegistration | undefined {
    const own = this.findOwn(token);
    if (own !== undefined) return own;
    for (const source of [...this.#imports, ...globalModules]) {
      const found = source.findExported(token);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  /** Whether an imported module offers the token to this module. */
  #isImported(identity: IToken): boolean {
    return this.#imports.some((imported) => imported.findExported(identity) !== undefined);
  }
}
