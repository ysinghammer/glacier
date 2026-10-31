import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { IClass } from "@glacier/reflection";
import type { IElementType } from "./IElementType.js";
import type { ITypeSpec } from "./ITypeSpec.js";

/** Turns the element type argument of a decorator into a type specification. */
export class ElementTypes {
  /**
   * Maps `source` to its specification: primitive constructors to their types, other classes to nested
   * objects, and functions without a `prototype` (arrow functions) to lazy references. Throws
   * `SchemaDefinitionError` naming `label` for anything else.
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
   * Maps a class to a nested object and an arrow function returning a class to a lazy reference, without
   * treating primitive constructors specially. Throws `SchemaDefinitionError` naming `label` for anything else.
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
