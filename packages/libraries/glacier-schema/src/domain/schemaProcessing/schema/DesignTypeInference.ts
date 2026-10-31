import { DESIGN_TYPE_METADATA } from "@glacier/reflection";
import type { IClass, IRuntimeType } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { IDesignType } from "./IDesignType.js";

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
   * Returns the primitive or class-reference type emitted for `member`, or `undefined` when nothing was
   * emitted (no `emitDecoratorMetadata`/registration) or the emitted type is uninformative, such as
   * `Object` for unions and interfaces, or an unsupported built-in container.
   */
  public static infer(target: IClass, member: string): IDesignType | undefined {
    const result = DESIGN_TYPE_METADATA.readDynamic(target, {
      kind: "member",
      member,
      inheritance: "own",
    });
    if (!result.isValid || !result.isPresent) return undefined;
    return DesignTypeInference.#describe(result.value);
  }

  /**
   * Returns the class emitted for `member`. Throws `SchemaDefinitionError` naming `label` when the emitted
   * type is missing or is not a class, so the class must be passed explicitly.
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

  /** Maps a runtime constructor to the type it denotes. */
  static #describe(runtimeType: IRuntimeType): IDesignType | undefined {
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
