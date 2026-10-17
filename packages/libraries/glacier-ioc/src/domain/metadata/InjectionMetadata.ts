import { DESIGN_PARAMETER_TYPES_METADATA } from "@glacier/reflection";
import type { IClass, IRuntimeType } from "@glacier/reflection";
import { InvalidProviderError } from "../failures/InvalidProvider.error.js";
import type { IToken } from "../tokens/IToken.js";
import type { IConstructorDependency } from "./IConstructorDependency.js";
import type { IProviderScope } from "./IProviderScope.js";
import { INJECT_TOKEN_METADATA } from "./InjectTokenMetadata.js";
import { INJECTABLE_SCOPE_METADATA } from "./InjectableScopeMetadata.js";
import { OPTIONAL_PARAMETER_METADATA } from "./OptionalParameterMetadata.js";

const DEFAULT_SCOPE: IProviderScope = "default";

/** Reads the declarations written by `@Injectable`, `@Inject` and `@Optional` without constructing anything. */
export class InjectionMetadata {
  /**
   * Returns the scope declared by `@Injectable` directly on the class, `"default"` when undeclared.
   * Throws `InvalidProviderError` when the target is not a readable class.
   */
  public static readScope(target: IClass): IProviderScope {
    const result = INJECTABLE_SCOPE_METADATA.read(target, { kind: "class", inheritance: "own" });
    if (!result.isValid) {
      throw new InvalidProviderError(target, `unreadable class metadata (${result.code})`);
    }
    return result.isPresent ? result.value : DEFAULT_SCOPE;
  }

  /**
   * Returns the constructor dependencies of the class in parameter order. Explicit `@Inject` tokens win;
   * otherwise the compiler-emitted `design:paramtypes` entry is used, which needs
   * `@glacier/reflection/register` and `emitDecoratorMetadata`.
   * Throws `InvalidProviderError` when emitted metadata is missing for a class with constructor parameters,
   * or when a parameter has neither an `@Inject` token nor a usable emitted class.
   */
  public static readDependencies(target: IClass): readonly IConstructorDependency[] {
    InjectionMetadata.readScope(target);
    const emitted = DESIGN_PARAMETER_TYPES_METADATA.read(target, {
      kind: "class",
      inheritance: "own",
    });
    const emittedTypes = emitted.isValid && emitted.isPresent ? emitted.value : undefined;
    if (emittedTypes === undefined && target.length > 0) {
      throw new InvalidProviderError(
        target,
        "constructor parameter types are unavailable; import @glacier/reflection/register, enable emitDecoratorMetadata and decorate the class",
      );
    }
    const parameterTypes = emittedTypes ?? [];
    return Object.freeze(
      parameterTypes.map((emittedType, position) => ({
        position,
        token: InjectionMetadata.#resolveToken(target, position, emittedType),
        isOptional: InjectionMetadata.#isOptional(target, position),
      })),
    );
  }

  /** Picks the explicit token or falls back to a usable emitted class. */
  static #resolveToken(target: IClass, position: number, emittedType: IRuntimeType): IToken {
    const explicit = INJECT_TOKEN_METADATA.readDynamic(target, {
      kind: "constructor-parameter",
      position,
      inheritance: "own",
    });
    if (explicit.isValid && explicit.isPresent) return explicit.value;
    if (typeof emittedType === "function" && emittedType !== Object && emittedType !== Function) {
      return emittedType;
    }
    throw new InvalidProviderError(
      target,
      `constructor parameter ${position} has no injectable type; add @Inject(token)`,
    );
  }

  /** Reads whether `@Optional` was declared for the parameter. */
  static #isOptional(target: IClass, position: number): boolean {
    const result = OPTIONAL_PARAMETER_METADATA.readDynamic(target, {
      kind: "constructor-parameter",
      position,
      inheritance: "own",
    });
    return result.isValid && result.isPresent && result.value;
  }
}
