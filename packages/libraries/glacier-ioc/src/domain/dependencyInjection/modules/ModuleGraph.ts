import { AggregateContainerError } from "../errors/AggregateContainer.error.js";
import { CircularDependencyError } from "../errors/CircularDependency.error.js";
import { DependencyValidation } from "./DependencyValidation.js";
import { InvalidModuleError } from "../errors/InvalidModule.error.js";
import { InjectionMetadata } from "../metadata/InjectionMetadata.js";
import type { IScopeProfile } from "../scopes/IScopeProfile.js";
import { ModuleRef } from "../scopes/ModuleRef.js";
import { ProviderScopes } from "../scopes/ProviderScopes.js";
import { ScopeAnalysis } from "../scopes/ScopeAnalysis.js";
import type { IClassConstructor } from "../providers/types/IClassConstructor.js";
import { ProviderNormalization } from "../providers/ProviderNormalization.js";
import type { IProviderRegistration } from "./types/IProviderRegistration.js";
import type { ITokenReference } from "../tokens/types/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";
import type { IModuleExport } from "./types/IModuleExport.js";
import type { IModuleReference } from "./types/IModuleReference.js";
import { ModuleMetadata } from "./ModuleMetadata.js";
import { ModuleNode } from "./ModuleNode.js";

/** Validated module graph with one node per reference and imports ordered before their dependents. */
export class ModuleGraph {
  /** Root module node from which the reachable graph was traversed. */
  public readonly root: ModuleNode;
  /** Reachable nodes in dependency order; each imported node precedes its importer. */
  public readonly dependencyOrder: readonly ModuleNode[];
  /** Global nodes whose exports are visible to every module in this graph. */
  private readonly globalModules: readonly ModuleNode[];
  /** Effective provider lifetimes computed after graph validation. */
  private readonly scopes: ScopeAnalysis;

  /**
   * Stores the validated graph and prepares its global lookup and scope indexes.
   * @param root Root node used to create the container.
   * @param dependencyOrder Reachable nodes with imports before importers.
   */
  private constructor(root: ModuleNode, dependencyOrder: readonly ModuleNode[]) {
    this.root = root;
    this.dependencyOrder = dependencyOrder;
    this.globalModules = dependencyOrder.filter((node) => node.isGlobal);
    this.scopes = ScopeAnalysis.create(
      dependencyOrder.flatMap((node) => node.listRegistrations()),
      this.globalModules,
    );
  }

  /** Builds and validates all modules and providers reachable from a root without constructing providers.
   * @param root Decorated module class or dynamic module used as the graph root.
   * @returns Validated graph with dependency order and provider scope profiles.
   * @throws {AggregateContainerError} If validation finds problems or no root node is produced.
   */
  public static build(root: IModuleReference): ModuleGraph {
    const problems: Error[] = [];
    const nodes = new Map<IModuleReference, ModuleNode>();
    const dependencyOrder: ModuleNode[] = [];
    const rootNode = ModuleGraph.visit(root, nodes, dependencyOrder, [], problems);
    for (const node of dependencyOrder) {
      for (const token of node.findUnavailableExports()) {
        problems.push(
          new InvalidModuleError(
            node.moduleClass,
            `exports ${TokenDescription.describe(token)} which it neither provides nor imports`,
          ),
        );
      }
    }
    problems.push(
      ...DependencyValidation.validate(
        dependencyOrder,
        dependencyOrder.filter((node) => node.isGlobal),
      ),
    );
    if (problems.length > 0 || rootNode === undefined) throw new AggregateContainerError(problems);
    return new ModuleGraph(rootNode, dependencyOrder);
  }

  /**
   * Gets the precomputed effective lifetime, including bubbled request binding.
   * @param registration Provider registration in this graph.
   * @returns Effective lifetime and request-binding state.
   */
  public profileOf(registration: IProviderRegistration): IScopeProfile {
    return this.scopes.profileOf(registration);
  }

  /**
   * Looks up a token using module visibility: own providers, imported exports, then global exports.
   * @param module Module whose visibility rules apply.
   * @param token Token to find.
   * @returns Matching registration, or `undefined` when no visible provider exists.
   */
  public findVisible(
    module: ModuleNode,
    token: ITokenReference,
  ): IProviderRegistration | undefined {
    return module.findVisible(token, this.globalModules);
  }

  /**
   * Searches all modules, preferring a dependent module over its dependencies.
   * @param token Token to find.
   * @returns First matching registration, or `undefined` when absent.
   */
  public findAnywhere(token: ITokenReference): IProviderRegistration | undefined {
    for (const node of [...this.dependencyOrder].reverse()) {
      const found = node.findOwn(token);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  /** Selects a graph node by exact reference first, then by module class.
   * @param reference Module class or dynamic module reference to select.
   * @returns Matching module node.
   * @throws {InvalidModuleError} If the referenced class is not part of this graph.
   */
  public select(reference: IModuleReference): ModuleNode {
    const exact = this.dependencyOrder.find((node) => node.reference === reference);
    const found = exact ?? this.dependencyOrder.find((node) => node.moduleClass === reference);
    if (found === undefined) {
      const target = typeof reference === "function" ? reference : reference.module;
      throw new InvalidModuleError(target, "the module is not part of this container");
    }
    return found;
  }

  /** Traverses one module and its imports, recording problems and appending valid nodes after imports.
   * @param reference Module class or dynamic module currently being visited.
   * @param nodes Nodes already created, keyed by their original reference.
   * @param dependencyOrder Mutable post-order output of successfully resolved nodes.
   * @param importing Ancestor nodes on the active traversal path for cycle detection.
   * @param problems Mutable collection of validation errors found during traversal.
   * @returns Existing or newly visited node; `undefined` when resolution fails.
   */
  private static visit(
    reference: IModuleReference,
    nodes: Map<IModuleReference, ModuleNode>,
    dependencyOrder: ModuleNode[],
    importing: readonly ModuleNode[],
    problems: Error[],
  ): ModuleNode | undefined {
    const known = nodes.get(reference);
    if (known !== undefined) {
      if (importing.includes(known)) {
        const cycle = [...importing.slice(importing.indexOf(known)), known];
        problems.push(new CircularDependencyError(cycle.map((node) => node.moduleClass)));
      }
      return known;
    }
    try {
      const resolved = ModuleMetadata.resolve(reference);
      const node = new ModuleNode(reference, resolved.moduleClass, resolved.isGlobal);
      nodes.set(reference, node);
      node.register(ModuleRef, ModuleRef.PROVIDER);
      ModuleGraph.registerProviders(node, resolved.providers, problems);
      for (const imported of resolved.imports) {
        const importedNode = ModuleGraph.visit(
          imported,
          nodes,
          dependencyOrder,
          [...importing, node],
          problems,
        );
        if (importedNode !== undefined) node.addImport(importedNode);
      }
      ModuleGraph.declareExports(node, resolved.exports, problems);
      dependencyOrder.push(node);
      return node;
    } catch (error) {
      // Metadata reading only throws ContainerError subclasses, which are collected.
      problems.push(error as Error);
      return undefined;
    }
  }

  /** Validates each declared provider and registers valid declarations, collecting failures.
   * @param node Module node that owns these providers.
   * @param declared Untrusted provider declarations from module metadata.
   * @param problems Mutable collection receiving normalization or metadata failures.
   * @returns No value; valid declarations are registered and failures are collected.
   */
  private static registerProviders(
    node: ModuleNode,
    declared: readonly unknown[],
    problems: Error[],
  ): void {
    declared.forEach((candidate, position) => {
      try {
        const provider = ProviderNormalization.normalize(candidate, position);
        if ("useClass" in provider) {
          ModuleGraph.inspectClass(provider.provide, provider.useClass);
        }
        node.register(provider.provide, provider);
      } catch (error) {
        // Normalization and metadata reading only throw ContainerError subclasses, which are collected.
        problems.push(error as Error);
      }
    });
  }

  /** Checks constructor metadata and scope for a class provider before graph use.
   * @param provide Token registered for the implementation.
   * @param implementation Class instantiated by the provider.
   * @returns No value; metadata-reader failures propagate to the traversal caller.
   */
  private static inspectClass(provide: ITokenReference, implementation: IClassConstructor): void {
    InjectionMetadata.readDependencies(implementation);
    ProviderScopes.assertValid(provide, InjectionMetadata.readScope(implementation));
  }

  /** Records exports as imported-module re-exports or provider tokens, reporting invalid entries.
   * @param node Module declaring these exports.
   * @param exported Untrusted export entries to classify.
   * @param problems Mutable collection receiving invalid-export errors.
   * @returns No value; valid exports are recorded and invalid entries are collected.
   */
  private static declareExports(
    node: ModuleNode,
    exported: readonly IModuleExport[],
    problems: Error[],
  ): void {
    for (const entry of exported) {
      const imported = node.findImport(entry as IModuleReference);
      if (imported !== undefined) {
        node.reExport(imported);
        continue;
      }
      if (ProviderNormalization.isTokenReference(entry)) {
        node.exportToken(entry);
        continue;
      }
      problems.push(
        new InvalidModuleError(
          node.moduleClass,
          "exports an entry that is not a token or an imported module",
        ),
      );
    }
  }
}
