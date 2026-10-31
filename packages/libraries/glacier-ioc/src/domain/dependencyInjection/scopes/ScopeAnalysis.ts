import type { IProviderScope } from "../metadata/IProviderScope.js";
import type { IProviderRegistration } from "../modules/IProviderRegistration.js";
import type { ModuleNode } from "../modules/ModuleNode.js";
import { ProviderDependencies } from "../modules/ProviderDependencies.js";
import type { IScopeProfile } from "./IScopeProfile.js";
import { ProviderScopes } from "./ProviderScopes.js";

/** Computes the effective scope of every provider, bubbling REQUEST up through dependents. */
export class ScopeAnalysis {
  readonly #globalModules: readonly ModuleNode[];
  readonly #profiles = new Map<IProviderRegistration, IScopeProfile>();

  private constructor(globalModules: readonly ModuleNode[]) {
    this.#globalModules = globalModules;
  }

  /**
   * Analyses every registration of a graph whose dependencies were already validated: every required
   * dependency is satisfied and there are no cycles. A provider depending on a REQUEST provider becomes
   * REQUEST, as does a transitive dependent; TRANSIENT never bubbles, but a TRANSIENT provider with a REQUEST
   * dependency stays transient and still makes its own dependents REQUEST. An alias takes the lifetime of its
   * target.
   */
  public static create(
    registrations: readonly IProviderRegistration[],
    globalModules: readonly ModuleNode[],
  ): ScopeAnalysis {
    const analysis = new ScopeAnalysis(globalModules);
    for (const registration of registrations) analysis.profileOf(registration);
    return analysis;
  }

  /** Returns the effective scope of a registration, computing and remembering it on first use. */
  public profileOf(registration: IProviderRegistration): IScopeProfile {
    const known = this.#profiles.get(registration);
    if (known !== undefined) return known;
    const profile = this.#compute(registration);
    this.#profiles.set(registration, profile);
    return profile;
  }

  #compute(registration: IProviderRegistration): IScopeProfile {
    const { provider, module } = registration;
    const dependencies = ProviderDependencies.of(registration).flatMap((dependency) => {
      const found = module.findVisible(dependency.token, this.#globalModules);
      return found === undefined ? [] : [this.profileOf(found)];
    });
    const declared =
      "useExisting" in provider
        ? ScopeAnalysis.#aliasScope(dependencies)
        : ProviderScopes.declaredBy(provider);
    const isRequestBound =
      declared === "request" || dependencies.some((dependency) => dependency.isRequestBound);
    if (declared === "transient") return { lifetime: "transient", isRequestBound };
    return { lifetime: isRequestBound ? "request" : "default", isRequestBound };
  }

  /** An alias is transient exactly when its target is, so it never caches a transient instance. */
  static #aliasScope(targets: readonly IScopeProfile[]): IProviderScope {
    return targets.some((target) => target.lifetime === "transient") ? "transient" : "default";
  }
}
