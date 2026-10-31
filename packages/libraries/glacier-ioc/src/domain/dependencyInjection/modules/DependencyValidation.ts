import { CircularDependencyError } from "../failures/CircularDependency.error.js";
import { UnknownDependencyError } from "../failures/UnknownDependency.error.js";
import type { IProviderRegistration } from "./IProviderRegistration.js";
import type { ModuleNode } from "./ModuleNode.js";
import { ProviderDependencies } from "./ProviderDependencies.js";

/** Checks the provider dependencies of a module graph without constructing anything. */
export class DependencyValidation {
  /**
   * Returns one error per required dependency that no provider satisfies and one per dependency cycle.
   * `@Optional` dependencies without a provider are fine; optional ones that exist still take part in cycles.
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
