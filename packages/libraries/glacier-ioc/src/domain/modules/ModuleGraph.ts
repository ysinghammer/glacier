import { AggregateContainerError } from "../failures/AggregateContainer.error.js";
import { CircularDependencyError } from "../failures/CircularDependency.error.js";
import { DependencyValidation } from "./DependencyValidation.js";
import { InvalidModuleError } from "../failures/InvalidModule.error.js";
import { InvalidScopeError } from "../failures/InvalidScope.error.js";
import { InjectionMetadata } from "../metadata/InjectionMetadata.js";
import type { IClassConstructor } from "../providers/IClassConstructor.js";
import { ProviderNormalization } from "../providers/ProviderNormalization.js";
import type { IProviderRegistration } from "./IProviderRegistration.js";
import type { ITokenReference } from "../tokens/ITokenReference.js";
import { TokenDescription } from "../tokens/TokenDescription.js";
import type { IModuleExport } from "./IModuleExport.js";
import type { IModuleReference } from "./IModuleReference.js";
import { ModuleMetadata } from "./ModuleMetadata.js";
import { ModuleNode } from "./ModuleNode.js";

/**
 * The validated set of modules reachable from a root, with one node per module reference. Building it
 * traverses imports, de-duplicates modules and orders them so every module follows its imports.
 */
export class ModuleGraph {
  /** The module the container was created from. */
  readonly root: ModuleNode;
  /** Every reachable module, each after the modules it imports (import cycles are reported as errors). */
  readonly dependencyOrder: readonly ModuleNode[];
  readonly #globalModules: readonly ModuleNode[];

  private constructor(root: ModuleNode, dependencyOrder: readonly ModuleNode[]) {
    this.root = root;
    this.dependencyOrder = dependencyOrder;
    this.#globalModules = dependencyOrder.filter((node) => node.isGlobal);
  }

  /**
   * Builds the graph, validating module metadata, provider shapes, class metadata, scopes, exports,
   * unsatisfied provider dependencies and circular module or provider dependencies up front. Throws one `AggregateContainerError` listing every problem found; nothing is constructed.
   */
  public static build(root: IModuleReference): ModuleGraph {
    const problems: Error[] = [];
    const nodes = new Map<IModuleReference, ModuleNode>();
    const dependencyOrder: ModuleNode[] = [];
    const rootNode = ModuleGraph.#visit(root, nodes, dependencyOrder, [], problems);
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

  /** Finds the provider visible to a module: own, imports' exports, then global modules' exports. */
  public findVisible(
    module: ModuleNode,
    token: ITokenReference,
  ): IProviderRegistration | undefined {
    return module.findVisible(token, this.#globalModules);
  }

  /** Finds a provider anywhere in the container, preferring dependents over their dependencies. */
  public findAnywhere(token: ITokenReference): IProviderRegistration | undefined {
    for (const node of [...this.dependencyOrder].reverse()) {
      const found = node.findOwn(token);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  /**
   * Returns the node for a module class or dynamic module, preferring an exact reference match.
   * Throws `InvalidModuleError` when the module is not part of the container.
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

  /**
   * Visits a module once, then its imports, appending the node after them; returns undefined on failure.
   * `importing` holds the modules currently being visited, so reaching one of them again is an import cycle.
   */
  static #visit(
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
      ModuleGraph.#registerProviders(node, resolved.providers, problems);
      for (const imported of resolved.imports) {
        const importedNode = ModuleGraph.#visit(
          imported,
          nodes,
          dependencyOrder,
          [...importing, node],
          problems,
        );
        if (importedNode !== undefined) node.addImport(importedNode);
      }
      ModuleGraph.#declareExports(node, resolved.exports, problems);
      dependencyOrder.push(node);
      return node;
    } catch (error) {
      // Metadata reading only throws ContainerError subclasses, which are collected.
      problems.push(error as Error);
      return undefined;
    }
  }

  /** Validates and registers each declared provider, collecting the failures of invalid ones. */
  static #registerProviders(
    node: ModuleNode,
    declared: readonly unknown[],
    problems: Error[],
  ): void {
    declared.forEach((candidate, position) => {
      try {
        const provider = ProviderNormalization.normalize(candidate, position);
        if ("useClass" in provider) {
          ModuleGraph.#inspectClass(provider.provide, provider.useClass);
        }
        node.register(provider.provide, provider);
      } catch (error) {
        // Normalization and metadata reading only throw ContainerError subclasses, which are collected.
        problems.push(error as Error);
      }
    });
  }

  /** Checks a class provider's constructor metadata and scope so resolution can read them without failing. */
  static #inspectClass(provide: ITokenReference, implementation: IClassConstructor): void {
    InjectionMetadata.readDependencies(implementation);
    const scope = InjectionMetadata.readScope(implementation);
    if (scope !== "default") {
      throw new InvalidScopeError([provide], `scope "${scope}" is not supported yet`);
    }
  }

  /** Classifies exports as re-exports of imported modules or as provider tokens. */
  static #declareExports(
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
