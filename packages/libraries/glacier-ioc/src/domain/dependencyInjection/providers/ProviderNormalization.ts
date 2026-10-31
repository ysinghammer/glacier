import { InvalidProviderError } from "../failures/InvalidProvider.error.js";
import { InvalidScopeError } from "../failures/InvalidScope.error.js";
import { ProviderScopes } from "../scopes/ProviderScopes.js";
import { InjectionToken } from "../tokens/InjectionToken.js";
import type { ITokenReference } from "../tokens/ITokenReference.js";
import type { IClassConstructor } from "./IClassConstructor.js";
import type { INormalizedProvider } from "./INormalizedProvider.js";

const PROVIDER_KINDS = ["useClass", "useValue", "useFactory", "useExisting"] as const;

/** Validates untrusted provider declarations and expands the class shorthand into explicit form. */
export class ProviderNormalization {
  /**
   * Returns the validated provider; a bare class becomes `{ provide, useClass }`.
   * Throws `InvalidProviderError` when the shape is not exactly one provider kind with a valid token and
   * matching members. `position` only labels errors for declarations whose token itself is unusable.
   */
  public static normalize(candidate: unknown, position: number): INormalizedProvider {
    if (ProviderNormalization.#isClass(candidate)) {
      return { provide: candidate, useClass: candidate as IClassConstructor };
    }
    if (typeof candidate !== "object" || candidate === null) {
      throw new InvalidProviderError(
        ProviderNormalization.#placeholder(position),
        "expected a class or a provider object",
      );
    }
    const record = candidate as Readonly<Record<string, unknown>>;
    const provide = record["provide"];
    if (!ProviderNormalization.isTokenReference(provide)) {
      throw new InvalidProviderError(
        ProviderNormalization.#placeholder(position),
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
    ProviderNormalization.#assertKindMembers(provide, kind, record);
    ProviderNormalization.#assertScope(provide, kind, record);
    return candidate as INormalizedProvider;
  }

  /** Checks the members belonging to the single declared provider kind. */
  static #assertKindMembers(
    provide: ITokenReference,
    kind: (typeof PROVIDER_KINDS)[number],
    record: Readonly<Record<string, unknown>>,
  ): void {
    if (kind === "useClass" && !ProviderNormalization.#isClass(record["useClass"])) {
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

  /** Checks the optional `scope`, which only class and factory providers can carry. */
  static #assertScope(
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

  /** Arrow functions and methods have no prototype and cannot be constructed, so they are not classes. */
  static #isClass(candidate: unknown): candidate is IClassConstructor {
    return typeof candidate === "function" && "prototype" in candidate;
  }

  /** Accepts the token forms consumers may supply; string tokens are intentionally rejected. */
  public static isTokenReference(candidate: unknown): candidate is ITokenReference {
    return (
      ProviderNormalization.#isClass(candidate) ||
      typeof candidate === "symbol" ||
      candidate instanceof InjectionToken
    );
  }

  /** Stands in for the token of a declaration that has none, so the error still names its position. */
  static #placeholder(position: number): symbol {
    return Symbol(`providers[${position}]`);
  }
}
