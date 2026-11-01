import { DESIGN_TYPE_METADATA } from "@glacier/reflection";
import type { IClass, IRuntimeType } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { IDesignType } from "./types/IDesignType.js";

const UNSUPPORTED_BUILT_INS: readonly IRuntimeType[] = [
  Object,
  Function,
  Array,
  Symbol,
  Map,
  Set,
  WeakMap,
  WeakSet,
  Promise,
  RegExp,
  Error,
];

/** Infers a field's base type from the compiler-emitted `design:type`, when it is informative. */
export class DesignTypeInference {
  /**
   * Reads informative compiler-emitted design type metadata for one property.
   * @param target Property-owning class.
   * @param member String property name to inspect.
   * @returns Primitive or class design type, or undefined when unavailable or uninformative.
   */
  public static infer(target: IClass, member: string): IDesignType | undefined {
    const result = DESIGN_TYPE_METADATA.readDynamic(target, {
      kind: "member",
      member,
      inheritance: "own",
    });
    if (!result.isValid || !result.isPresent) return undefined;
    return DesignTypeInference.describe(result.value);
  }

  /**
   * Requires emitted metadata to identify a nested class for one property.
   * @param target Property-owning class.
   * @param member String property name to inspect.
   * @param label Field label used in the definition error.
   * @returns Emitted nested-class constructor.
   * @throws {SchemaDefinitionError} If metadata is absent or does not identify a class.
   */
  public static inferClass(target: IClass, member: string, label: string): IClass {
    const inferred = DesignTypeInference.infer(target, member);
    if (inferred?.kind !== "class") {
      throw new SchemaDefinitionError(
        `${label}: IsObject needs a class argument because no class type was emitted for the property`,
      );
    }
    return inferred.target;
  }

  /**
   * Maps an emitted runtime constructor to its supported design type.
   * @param runtimeType Constructor emitted by the TypeScript decorator metadata transform.
   * @returns Supported primitive/class type, or undefined for uninformative constructors.
   */
  private static describe(runtimeType: IRuntimeType): IDesignType | undefined {
    if (runtimeType === String) return { kind: "string" };
    if (runtimeType === Number) return { kind: "number" };
    if (runtimeType === Boolean) return { kind: "boolean" };
    if (runtimeType === BigInt) return { kind: "bigint" };
    if (runtimeType === Date) return { kind: "date" };
    if (typeof runtimeType !== "function" || UNSUPPORTED_BUILT_INS.includes(runtimeType)) {
      return undefined;
    }
    return { kind: "class", target: runtimeType as IClass };
  }
}
