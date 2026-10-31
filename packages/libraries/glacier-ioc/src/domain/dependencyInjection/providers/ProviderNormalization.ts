import { InvalidProviderError } from "../errors/InvalidProvider.error.js";
import { InvalidScopeError } from "../errors/InvalidScope.error.js";
import { ProviderScopes } from "../scopes/ProviderScopes.js";
import { InjectionToken } from "../tokens/InjectionToken.js";
import type { ITokenReference } from "../tokens/types/ITokenReference.js";
import type { IClassConstructor } from "./types/IClassConstructor.js";
import type { INormalizedProvider } from "./types/INormalizedProvider.js";

const PROVIDER_KINDS = ["useClass", "useValue", "useFactory", "useExisting"] as const;

/** Validates provider declarations and expands bare classes into normalized class providers. */
export class ProviderNormalization {
  /**
   * Validates an untrusted declaration and expands bare class shorthand.
   * @param candidate Untrusted module provider declaration.
   * @param position Zero-based declaration index used to label entries without a valid token.
   * @returns Normalized provider with explicit token and provider kind.
   * @throws {InvalidProviderError} If the declaration is not an object or class.
   * @throws {InvalidProviderError} If its `provide` member is not a class, symbol or injection token.
   * @throws {InvalidProviderError} If it declares zero or multiple provider kinds.
   */
  public static normalize(candidate: unknown, position: number): INormalizedProvider {
    if (ProviderNormalization.isClass(candidate)) {
      return { provide: candidate, useClass: candidate as IClassConstructor };
    }
    if (typeof candidate !== "object" || candidate === null) {
      throw new InvalidProviderError(
        ProviderNormalization.placeholder(position),
        "expected a class or a provider object",
      );
    }
    const record = candidate as Readonly<Record<string, unknown>>;
    const provide = record["provide"];
    if (!ProviderNormalization.isTokenReference(provide)) {
      throw new InvalidProviderError(
        ProviderNormalization.placeholder(position),
        "`provide` must be a class, symbol or InjectionToken",
      );
    }
    const kinds = PROVIDER_KINDS.filter((kind) => kind in record);
    const [kind] = kinds;
    if (kind === undefined || kinds.length > 1) {
      throw new InvalidProviderError(
        provide,
        `expected exactly one of ${PROVIDER_KINDS.join(", ")} but found ${kinds.length}`,
      );
    }
    ProviderNormalization.assertKindMembers(provide, kind, record);
    ProviderNormalization.assertScope(provide, kind, record);
    return candidate as INormalizedProvider;
  }

  /**
   * Validates the fields required by the selected provider kind.
   * @param provide Valid token used to identify failures.
   * @param kind The single provider kind declared by the record.
   * @param record Untrusted provider fields.
   * @returns No value; returns when all kind-specific members are valid.
   * @throws {InvalidProviderError} If a class, alias, factory or inject field has an invalid shape.
   */
  private static assertKindMembers(
    provide: ITokenReference,
    kind: (typeof PROVIDER_KINDS)[number],
    record: Readonly<Record<string, unknown>>,
  ): void {
    if (kind === "useClass" && !ProviderNormalization.isClass(record["useClass"])) {
      throw new InvalidProviderError(provide, "`useClass` must be a class");
    }
    if (kind === "useExisting" && !ProviderNormalization.isTokenReference(record["useExisting"])) {
      throw new InvalidProviderError(
        provide,
        "`useExisting` must be a class, symbol or InjectionToken",
      );
    }
    if (kind !== "useFactory") return;
    if (typeof record["useFactory"] !== "function") {
      throw new InvalidProviderError(provide, "`useFactory` must be a function");
    }
    const inject = record["inject"];
    const isValidInject =
      inject === undefined ||
      (Array.isArray(inject) &&
        inject.every((token: unknown) => ProviderNormalization.isTokenReference(token)));
    if (!isValidInject) {
      throw new InvalidProviderError(
        provide,
        "`inject` must be an array of classes, symbols or InjectionTokens",
      );
    }
  }

  /** Validates optional scope presence and provider-kind compatibility.
   * @param provide Provider token associated with the scope.
   * @param kind Declared provider kind.
   * @param record Untrusted provider fields containing the optional scope.
   * @returns No value; returns when scope is absent or compatible.
   * @throws {InvalidScopeError} If value or alias providers declare a scope.
   */
  private static assertScope(
    provide: ITokenReference,
    kind: (typeof PROVIDER_KINDS)[number],
    record: Readonly<Record<string, unknown>>,
  ): void {
    if (record["scope"] === undefined) return;
    if (kind === "useValue" || kind === "useExisting") {
      throw new InvalidScopeError([provide], `${kind} providers cannot declare a scope`);
    }
    ProviderScopes.assertValid(provide, record["scope"]);
  }

  /**
   * Narrows functions to constructable class-like values.
   * @param candidate Untrusted value to test.
   * @returns `true` when the value is a function with a prototype.
   */
  private static isClass(candidate: unknown): candidate is IClassConstructor {
    return typeof candidate === "function" && "prototype" in candidate;
  }

  /**
   * Narrows values to supported consumer token references.
   * @param candidate Untrusted value to test.
   * @returns `true` for a class, symbol or `InjectionToken` instance.
   */
  public static isTokenReference(candidate: unknown): candidate is ITokenReference {
    return (
      ProviderNormalization.isClass(candidate) ||
      typeof candidate === "symbol" ||
      candidate instanceof InjectionToken
    );
  }

  /**
   * Creates a diagnostic token for a declaration without a usable token.
   * @param position Zero-based provider declaration index.
   * @returns Unique symbol identifying that declaration position.
   */
  private static placeholder(position: number): symbol {
    return Symbol(`providers[${position}]`);
  }
}
