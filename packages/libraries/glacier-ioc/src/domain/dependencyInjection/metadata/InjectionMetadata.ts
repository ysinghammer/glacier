import { DESIGN_PARAMETER_TYPES_METADATA } from "@glacier/reflection";
import type { IClass, IRuntimeType } from "@glacier/reflection";
import { InvalidProviderError } from "../errors/InvalidProvider.error.js";
import type { IToken } from "../tokens/types/IToken.js";
import type { IConstructorDependency } from "./types/IConstructorDependency.js";
import type { IProviderScope } from "./types/IProviderScope.js";
import { INJECT_TOKEN_METADATA } from "./InjectTokenMetadata.js";
import { INJECTABLE_SCOPE_METADATA } from "./InjectableScopeMetadata.js";
import { OPTIONAL_PARAMETER_METADATA } from "./OptionalParameterMetadata.js";

const DEFAULT_SCOPE: IProviderScope = "default";

/** Reads class and constructor injection declarations without creating provider instances. */
export class InjectionMetadata {
  /**
   * Reads a class's own `@Injectable` scope, using `"default"` when no scope is declared.
   * @param target Class whose own scope metadata is read.
   * @returns Declared provider scope or `"default"`.
   * @throws {InvalidProviderError} If the class metadata cannot be read.
   */
  public static readScope(target: IClass): IProviderScope {
    const result = INJECTABLE_SCOPE_METADATA.read(target, {
      kind: "class",
      inheritance: "own",
    });
    if (!result.isValid) {
      throw new InvalidProviderError(target, `unreadable class metadata (${result.code})`);
    }
    return result.isPresent ? result.value : DEFAULT_SCOPE;
  }

  /**
   * Reads dependencies by parameter position, preferring `@Inject` to emitted class types.
   * @param target Class whose constructor metadata is read.
   * @returns Frozen dependencies in constructor parameter order.
   * @throws {InvalidProviderError} If parameter types are missing for a non-empty constructor.
   * @remarks Implicit types require reflection registration and `emitDecoratorMetadata`.
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
        token: InjectionMetadata.resolveToken(target, position, emittedType),
        isOptional: InjectionMetadata.isOptional(target, position),
      })),
    );
  }

  /**
   * Selects an explicit token or a supported emitted class type.
   * @param target Class declaring the parameter.
   * @param position Zero-based constructor parameter position.
   * @param emittedType Compiler-emitted runtime type for that parameter.
   * @returns Explicit token when present, otherwise the emitted class token.
   * @throws {InvalidProviderError} If neither source provides an injectable token.
   */
  private static resolveToken(target: IClass, position: number, emittedType: IRuntimeType): IToken {
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

  /**
   * Reads whether `@Optional` is declared on a constructor parameter.
   * @param target Class declaring the parameter.
   * @param position Zero-based constructor parameter position.
   * @returns `true` only when valid optional metadata is present and enabled.
   */
  private static isOptional(target: IClass, position: number): boolean {
    const result = OPTIONAL_PARAMETER_METADATA.readDynamic(target, {
      kind: "constructor-parameter",
      position,
      inheritance: "own",
    });
    return result.isValid && result.isPresent && result.value;
  }
}
