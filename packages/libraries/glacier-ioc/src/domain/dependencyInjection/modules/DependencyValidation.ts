import { CircularDependencyError } from "../errors/CircularDependency.error.js";
import { UnknownDependencyError } from "../errors/UnknownDependency.error.js";
import type { IProviderRegistration } from "./types/IProviderRegistration.js";
import type { ModuleNode } from "./ModuleNode.js";
import { ProviderDependencies } from "./ProviderDependencies.js";

/** Finds missing required provider dependencies and provider cycles without constructing instances. */
export class DependencyValidation {
  /**
   * Validates dependency visibility and cycles across registered providers.
   * @param nodes Modules whose registrations are checked.
   * @param globalModules Modules whose exports are visible throughout the graph.
   * @returns Errors in traversal order; optional missing dependencies are omitted.
   */
  public static validate(
    nodes: readonly ModuleNode[],
    globalModules: readonly ModuleNode[],
  ): readonly Error[] {
    const problems: Error[] = [];
    const registrations = nodes.flatMap((node) => node.listRegistrations());
    const targetsOf = (registration: IProviderRegistration): IProviderRegistration[] =>
      ProviderDependencies.of(registration).flatMap((dependency) => {
        const found = registration.module.findVisible(dependency.token, globalModules);
        if (found === undefined && !dependency.isOptional) {
          problems.push(
            new UnknownDependencyError([registration.provider.provide, dependency.token]),
          );
        }
        return found === undefined ? [] : [found];
      });
    const finished = new Set<IProviderRegistration>();
    const stack: IProviderRegistration[] = [];
    const visit = (registration: IProviderRegistration): void => {
      stack.push(registration);
      for (const target of targetsOf(registration)) {
        if (stack.includes(target)) {
          const cycle = [...stack.slice(stack.indexOf(target)), target];
          problems.push(new CircularDependencyError(cycle.map((entry) => entry.provider.provide)));
        } else if (!finished.has(target)) visit(target);
      }
      stack.pop();
      finished.add(registration);
    };
    for (const registration of registrations) {
      if (!finished.has(registration)) visit(registration);
    }
    return problems;
  }
}
