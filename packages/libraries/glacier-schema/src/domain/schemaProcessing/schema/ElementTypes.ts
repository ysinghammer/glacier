import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { IClass } from "@glacier/reflection";
import type { IElementType } from "./types/IElementType.js";
import type { ITypeSpec } from "./types/ITypeSpec.js";

/** Turns the element type argument of a decorator into a type specification. */
export class ElementTypes {
  /**
   * Converts a decorator element argument into a scalar, nested-class or lazy type specification.
   * @param source Primitive constructor, decorated class or lazy class reference.
   * @param label Field label used in definition diagnostics.
   * @returns Corresponding field type specification.
   */
  public static resolve(source: IElementType, label: string): ITypeSpec {
    if (source === String) return { kind: "string", rules: {} };
    if (source === Number) return { kind: "number", rules: {} };
    if (source === Boolean) return { kind: "boolean" };
    if (source === BigInt) return { kind: "bigint" };
    if (source === Date) return { kind: "date" };
    return ElementTypes.resolveClass(source, label);
  }

  /**
   * Converts a class or lazy class reference into its nested type specification.
   * @param source Class constructor or thunk returning a class.
   * @param label Field label used in definition diagnostics.
   * @returns Object or lazy type specification for nested validation.
   * @throws {SchemaDefinitionError} If `source` is not a class or reference function.
   */
  public static resolveClass(source: IClass | (() => IClass), label: string): ITypeSpec {
    if (typeof source !== "function") {
      throw new SchemaDefinitionError(
        `${label}: element type must be a primitive constructor, a class or a () => class reference`,
      );
    }
    if (Object.hasOwn(source, "prototype")) return { kind: "object", target: source as IClass };
    return { kind: "lazy", resolve: source as () => IClass };
  }
}
