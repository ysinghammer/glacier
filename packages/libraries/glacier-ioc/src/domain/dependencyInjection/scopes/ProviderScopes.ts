import { InvalidScopeError } from "../errors/InvalidScope.error.js";
import type { IProviderScope } from "../metadata/types/IProviderScope.js";
import { InjectionMetadata } from "../metadata/InjectionMetadata.js";
import type { INormalizedProvider } from "../providers/types/INormalizedProvider.js";
import type { ITokenReference } from "../tokens/types/ITokenReference.js";

const PROVIDER_SCOPES: readonly IProviderScope[] = ["default", "transient", "request"];

/** Validates supported provider scope literals and reads declarations before scope bubbling. */
export class ProviderScopes {
  /**
   * Checks an untrusted value against the supported scope literals.
   * @param candidate Value to test.
   * @returns `true` when the value is a supported provider scope.
   */
  public static isValid(candidate: unknown): candidate is IProviderScope {
    return PROVIDER_SCOPES.some((scope) => scope === candidate);
  }

  /**
   * Validates a scope value for a provider token.
   * @param provide Provider token associated with the scope.
   * @param candidate Untrusted scope value to validate.
   * @returns No value; returns normally when the scope is valid.
   * @throws {InvalidScopeError} If the value is not a supported scope literal.
   */
  public static assertValid(provide: ITokenReference, candidate: unknown): void {
    if (ProviderScopes.isValid(candidate)) return;
    throw new InvalidScopeError(
      [provide],
      `unknown scope ${String(candidate)}, expected one of ${PROVIDER_SCOPES.join(", ")}`,
    );
  }

  /** Reads the provider's own declared scope without applying dependency bubbling.
   * @param provider Validated normalized provider declaration.
   * @returns Declared scope, using class metadata or `"default"` as applicable.
   */
  public static declaredBy(provider: INormalizedProvider): IProviderScope {
    if ("useValue" in provider || "useExisting" in provider) return "default";
    if (provider.scope !== undefined) return provider.scope;
    return "useClass" in provider ? InjectionMetadata.readScope(provider.useClass) : "default";
  }
}
