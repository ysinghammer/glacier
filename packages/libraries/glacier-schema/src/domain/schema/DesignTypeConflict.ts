import type { IClass } from "@glacier/reflection";
import { DesignTypeInference } from "./DesignTypeInference.js";
import type { ITypeSpec } from "./ITypeSpec.js";

const EXPECTED_DESIGN_KIND: Readonly<Partial<Record<ITypeSpec["kind"], string>>> = {
  string: "string",
  number: "number",
  int: "number",
  boolean: "boolean",
  bigint: "bigint",
  date: "date",
};

/** Detects primitive decorators that contradict the compiler-emitted type of their property. */
export class DesignTypeConflict {
  /**
   * Returns a description of the conflict between the declared `type` and the emitted design type of
   * `member`, or `undefined` when they agree, nothing informative was emitted, or the declared type
   * (literal, enum, any) intentionally accepts any design type.
   */
  public static describe(target: IClass, member: string, type: ITypeSpec): string | undefined {
    const expectedKind = EXPECTED_DESIGN_KIND[type.kind];
    if (expectedKind === undefined) return undefined;
    const inferred = DesignTypeInference.infer(target, member);
    if (inferred === undefined || inferred.kind === expectedKind) return undefined;
    const emitted = inferred.kind === "class" ? inferred.target.name : inferred.kind;
    return `declared as ${type.kind} but its TypeScript type is ${emitted}`;
  }
}
