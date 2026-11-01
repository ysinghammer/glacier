import type { INormalizedProvider } from "../providers/types/INormalizedProvider.js";
import type { IClassConstructor } from "../providers/types/IClassConstructor.js";
import { TokenIdentity } from "../tokens/TokenIdentity.js";
import type { IToken } from "../tokens/types/IToken.js";
import type { ITokenReference } from "../tokens/types/ITokenReference.js";
import type { IModuleReference } from "./types/IModuleReference.js";
import type { IProviderRegistration } from "./types/IProviderRegistration.js";

/** Holds one graph module's registrations, imports and exports while the graph is assembled and queried. */
export class ModuleNode {
  /** The class or dynamic module this node was created from; the graph keeps one node per reference. */
  public readonly reference: IModuleReference;
  /** The decorated module class. */
  public readonly moduleClass: IClassConstructor;
  /** Whether the module's exports are visible container-wide. */
  public readonly isGlobal: boolean;
  /**
   * Own providers keyed by normalized token identity.
   * @default Empty map when the node is constructed.
   */
  private readonly registrations = new Map<IToken, IProviderRegistration>();
  /**
   * Export declarations keyed by normalized token identity.
   * @default Empty map when the node is constructed.
   */
  private readonly exportedTokens = new Map<IToken, ITokenReference>();
  /**
   * Imported modules whose exports this node re-exports.
   * @default Empty list when the node is constructed.
   */
  private readonly reExportedModules: ModuleNode[] = [];
  /**
   * Modules imported directly by this node.
   * @default Empty list when the node is constructed.
   */
  private readonly imports: ModuleNode[] = [];

  /** Creates an empty node for graph assembly.
   * @param reference Original class or dynamic module reference represented by this node.
   * @param moduleClass Decorated class that declares the module.
   * @param isGlobal Whether this module's exports are visible throughout the graph.
   */
  public constructor(
    reference: IModuleReference,
    moduleClass: IClassConstructor,
    isGlobal: boolean,
  ) {
    this.reference = reference;
    this.moduleClass = moduleClass;
    this.isGlobal = isGlobal;
  }

  /** Stores an own provider, replacing any earlier registration with the same token identity.
   * @param token Provider token or typed token reference.
   * @param provider Validated normalized provider declaration.
   * @returns No value; updates this node's provider registry.
   */
  public register(token: ITokenReference, provider: INormalizedProvider): void {
    this.registrations.set(TokenIdentity.of(token), {
      module: this,
      provider,
    });
  }

  /** Adds a direct import once, preserving its first position.
   * @param imported Module node to import.
   * @returns No value; duplicate node references do not add another entry.
   */
  public addImport(imported: ModuleNode): void {
    if (!this.imports.includes(imported)) this.imports.push(imported);
  }

  /** Declares a token visible to importers.
   * @param token Token to export.
   * @returns No value; stores the export under normalized token identity.
   */
  public exportToken(token: ITokenReference): void {
    this.exportedTokens.set(TokenIdentity.of(token), token);
  }

  /** Declares the exports of an imported module as re-exported.
   * @param imported Imported module whose exports are forwarded.
   * @returns No value; records the re-exported module.
   */
  public reExport(imported: ModuleNode): void {
    this.reExportedModules.push(imported);
  }

  /** Finds an imported node by exact reference or matching module class.
   * @param reference Module class or dynamic module to find.
   * @returns Matching direct import, or `undefined` when absent.
   */
  public findImport(reference: IModuleReference): ModuleNode | undefined {
    return this.imports.find(
      (imported) => imported.reference === reference || imported.moduleClass === reference,
    );
  }

  /** Finds this module's registration without applying export visibility.
   * @param token Provider token to find.
   * @returns Own registration, or `undefined` when absent.
   */
  public findOwn(token: ITokenReference): IProviderRegistration | undefined {
    return this.registrations.get(TokenIdentity.of(token));
  }

  /** Copies the current own provider registrations.
   * @returns Registrations in provider insertion order.
   */
  public listRegistrations(): readonly IProviderRegistration[] {
    return [...this.registrations.values()];
  }

  /** Finds declared token exports that neither resolve locally nor come from a direct import.
   * @returns Unavailable exported token references in declaration order.
   */
  public findUnavailableExports(): readonly ITokenReference[] {
    return [...this.exportedTokens.entries()]
      .filter(
        ([identity, token]) => this.findOwn(token) === undefined && !this.isImported(identity),
      )
      .map(([, token]) => token);
  }

  /** Searches exports and re-exports while guarding repeated nodes in the current lookup.
   * @param token Token requested by an importing module.
   * @param visited Mutable set of nodes already traversed; defaults to a fresh set.
   * @returns Exported provider registration, or `undefined` when not offered.
   */
  public findExported(
    token: ITokenReference,
    visited: Set<ModuleNode> = new Set(),
  ): IProviderRegistration | undefined {
    if (visited.has(this)) return undefined;
    visited.add(this);
    const own = this.findOwn(token);
    if (own !== undefined && this.exportedTokens.has(TokenIdentity.of(token))) return own;
    const sources = this.exportedTokens.has(TokenIdentity.of(token))
      ? this.imports
      : this.reExportedModules;
    for (const source of sources) {
      const found = source.findExported(token, visited);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  /** Applies this module's lookup precedence: own providers, direct imports, then global exports.
   * @param token Token requested by a provider in this module.
   * @param globalModules Global modules whose exports are visible here.
   * @returns Visible registration, or `undefined` when no provider matches.
   */
  public findVisible(
    token: ITokenReference,
    globalModules: readonly ModuleNode[],
  ): IProviderRegistration | undefined {
    const own = this.findOwn(token);
    if (own !== undefined) return own;
    for (const source of [...this.imports, ...globalModules]) {
      const found = source.findExported(token);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  /** Checks whether any direct import exports the given token identity.
   * @param identity Normalized class or symbol token identity.
   * @returns `true` when an imported module provides the token as an export.
   */
  private isImported(identity: IToken): boolean {
    return this.imports.some((imported) => imported.findExported(identity) !== undefined);
  }
}
