import { InvalidScopeError } from "../failures/InvalidScope.error.js";
import type { IProviderScope } from "../metadata/IProviderScope.js";
import { InjectionMetadata } from "../metadata/InjectionMetadata.js";
import type { INormalizedProvider } from "../providers/INormalizedProvider.js";
import type { ITokenReference } from "../tokens/ITokenReference.js";

const PROVIDER_SCOPES: readonly IProviderScope[] = ["default", "transient", "request"];

/** Validates and reads the scope a provider declares, before bubbling is applied. */
export class ProviderScopes {
  /** Whether the untrusted value is one of the supported scope literals. */
  public static isValid(candidate: unknown): candidate is IProviderScope {
    return PROVIDER_SCOPES.some((scope) => scope === candidate);
  }

  /** Throws `InvalidScopeError` when the untrusted scope is not a supported literal. */
  public static assertValid(provide: ITokenReference, candidate: unknown): void {
    if (ProviderScopes.isValid(candidate)) return;
    throw new InvalidScopeError(
      [provide],
      `unknown scope ${String(candidate)}, expected one of ${PROVIDER_SCOPES.join(", ")}`,
    );
  }

  /**
   * Returns the scope the provider itself declares: the provider object's `scope`, else the class's
   * `@Injectable` scope for class providers, else `"default"`. Aliases and values are always `"default"`.
   */
  public static declaredBy(provider: INormalizedProvider): IProviderScope {
    if ("useValue" in provider || "useExisting" in provider) return "default";
    if (provider.scope !== undefined) return provider.scope;
    return "useClass" in provider ? InjectionMetadata.readScope(provider.useClass) : "default";
  }
}
