import type { IProviderScope } from "../metadata/types/IProviderScope.js";
import type { IProviderRegistration } from "../modules/types/IProviderRegistration.js";
import type { ModuleNode } from "../modules/ModuleNode.js";
import { ProviderDependencies } from "../modules/ProviderDependencies.js";
import type { IScopeProfile } from "./IScopeProfile.js";
import { ProviderScopes } from "./ProviderScopes.js";

/** Computes effective provider lifetimes and propagates request binding through dependents. */
export class ScopeAnalysis {
  /** Global modules consulted when resolving each registration's dependencies. */
  private readonly globalModules: readonly ModuleNode[];
  /**
   * Cached effective profiles keyed by registration identity.
   * @default Empty map before profile analysis.
   */
  private readonly profiles = new Map<IProviderRegistration, IScopeProfile>();

  /**
   * Creates an empty profile index for the module graph.
   * @param globalModules Global nodes used during dependency visibility checks.
   */
  private constructor(globalModules: readonly ModuleNode[]) {
    this.globalModules = globalModules;
  }

  /** Profiles registrations after graph validation, assuming dependencies are satisfied and acyclic.
   * @param registrations Provider registrations whose profiles are required.
   * @param globalModules Global nodes consulted for dependency visibility.
   * @returns Analysis index with every supplied registration profiled.
   * @remarks Request binding bubbles; transience does not. Aliases inherit target lifetime.
   */
  public static create(
    registrations: readonly IProviderRegistration[],
    globalModules: readonly ModuleNode[],
  ): ScopeAnalysis {
    const analysis = new ScopeAnalysis(globalModules);
    for (const registration of registrations) analysis.profileOf(registration);
    return analysis;
  }

  /**
   * Gets a registration's effective lifetime, computing and caching it when absent.
   * @param registration Registration to profile.
   * @returns Effective lifetime and request-binding state.
   */
  public profileOf(registration: IProviderRegistration): IScopeProfile {
    const known = this.profiles.get(registration);
    if (known !== undefined) return known;
    const profile = this.compute(registration);
    this.profiles.set(registration, profile);
    return profile;
  }

  /** Resolves dependency profiles and applies declared-scope bubbling rules.
   * @param registration Registration whose dependencies determine its effective profile.
   * @returns Computed lifetime and request-binding state.
   */
  private compute(registration: IProviderRegistration): IScopeProfile {
    const { provider, module } = registration;
    const dependencies = ProviderDependencies.of(registration).flatMap((dependency) => {
      const found = module.findVisible(dependency.token, this.globalModules);
      return found === undefined ? [] : [this.profileOf(found)];
    });
    const declared =
      "useExisting" in provider
        ? ScopeAnalysis.aliasScope(dependencies)
        : ProviderScopes.declaredBy(provider);
    const isRequestBound =
      declared === "request" || dependencies.some((dependency) => dependency.isRequestBound);
    if (declared === "transient") return { lifetime: "transient", isRequestBound };
    return { lifetime: isRequestBound ? "request" : "default", isRequestBound };
  }

  /** Derives alias lifetime from its resolved target profiles.
   * @param targets Profiles of the aliased provider's dependencies.
   * @returns `"transient"` when a target is transient; otherwise `"default"`.
   */
  private static aliasScope(targets: readonly IScopeProfile[]): IProviderScope {
    return targets.some((target) => target.lifetime === "transient") ? "transient" : "default";
  }
}
