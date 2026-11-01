import { DESIGN_TYPE_METADATA } from "../../../../domain/metadataReflection/compilerMetadata/DesignTypeMetadata.js";
import { DESIGN_PARAMETER_TYPES_METADATA } from "../../../../domain/metadataReflection/compilerMetadata/DesignParameterTypesMetadata.js";
import { DESIGN_RETURN_TYPE_METADATA } from "../../../../domain/metadataReflection/compilerMetadata/DesignReturnTypeMetadata.js";
import type { IRuntimeType } from "../../../../domain/metadataReflection/compilerMetadata/types/IRuntimeType.js";
import type { ICompilerMetadataRejectionCode } from "../../../../domain/metadataReflection/compilerMetadata/types/ICompilerMetadataRejectionCode.js";
import type { IClass } from "../../../../domain/metadataReflection/targets/types/IClass.js";
import type { IDynamicClassMetadataAddress } from "../../../../domain/metadataReflection/addressing/types/IDynamicClassMetadataAddress.js";
import { MetadataTarget } from "../../../../domain/metadataReflection/targets/MetadataTarget.js";

/**
 * Validated compiler metadata ready for recording, or a rejection explaining unsupported input.
 * @property isValid Discriminates prepared metadata from rejected compiler input.
 * @property key Supported design metadata key; present only for prepared metadata.
 * @property value Runtime type or frozen snapshot of runtime parameter types.
 * @property code Rejection category; present only when isValid is false.
 */
type ICompilerDeclaration =
  | {
      readonly isValid: true;
      readonly key: "design:type" | "design:returntype";
      readonly value: IRuntimeType;
    }
  | {
      readonly isValid: true;
      readonly key: "design:paramtypes";
      readonly value: readonly IRuntimeType[];
    }
  | { readonly isValid: false; readonly code: ICompilerMetadataRejectionCode };

/** Validates compiler-emitted metadata and records it through the ordinary metadata definitions. */
export class CompilerMetadataRecorder {
  /** Validates supported keys and snapshots every dense parameter entry before returning success.
   * @param key Unknown key; accepts design:type, design:paramtypes, or design:returntype.
   * @param value Unknown emitted type; parameter types must be a dense array of functions/undefined.
   * @returns Prepared value or frozen parameter snapshot, or unsupported-key/value rejection.
   */
  public static prepare(key: unknown, value: unknown): ICompilerDeclaration {
    if (key !== "design:type" && key !== "design:paramtypes" && key !== "design:returntype") {
      return { isValid: false, code: "unsupported-compiler-key" };
    }
    if (key !== "design:paramtypes") {
      if (!this.isRepresentation(value)) return { isValid: false, code: "invalid-compiler-value" };
      return { isValid: true, key, value };
    }
    if (!Array.isArray(value)) return { isValid: false, code: "invalid-compiler-value" };
    const entries: readonly unknown[] = value;
    const snapshot: IRuntimeType[] = [];
    const length = entries.length;
    for (let position = 0; position < length; position++) {
      if (!Object.hasOwn(entries, position)) {
        return { isValid: false, code: "invalid-compiler-value" };
      }
      const entry = entries[position];
      if (!this.isRepresentation(entry)) {
        return { isValid: false, code: "invalid-compiler-value" };
      }
      snapshot.push(entry);
    }
    return { isValid: true, key, value: Object.freeze(snapshot) };
  }

  /** Validates the address, then writes the selected design metadata; descriptors must be non-null objects.
   * @param declaration Valid metadata from prepare; rejected declarations cannot be recorded.
   * @param arguments_ Class alone, or target/member/optional descriptor; member: string, number, symbol.
   * @returns Success after recording, or a rejection for an invalid target or member location.
   */
  public static record(
    declaration: Extract<ICompilerDeclaration, { readonly isValid: true }>,
    arguments_: readonly unknown[],
  ):
    | { readonly isValid: true }
    | { readonly isValid: false; readonly code: ICompilerMetadataRejectionCode } {
    const normalized = this.normalize(arguments_);
    if (!normalized.isValid) return normalized;
    let result;
    if (declaration.key === "design:paramtypes") {
      result = DESIGN_PARAMETER_TYPES_METADATA.setDynamic(
        normalized.owner,
        declaration.value,
        normalized.address,
      );
    } else if (declaration.key === "design:type") {
      result = DESIGN_TYPE_METADATA.setDynamic(
        normalized.owner,
        declaration.value,
        normalized.address,
      );
    } else {
      result = DESIGN_RETURN_TYPE_METADATA.setDynamic(
        normalized.owner,
        declaration.value,
        normalized.address,
      );
    }
    if (!result.isValid) return { isValid: false, code: "invalid-decorator-location" };
    return result;
  }

  /** Resolves class-only or class/prototype calls; numeric keys become strings, descriptors must be non-null objects.
   * @param arguments_ Class alone, or target/member/optional descriptor; member: string, number, symbol.
   * @returns Class/member address and owner/side, or a target/location rejection.
   */
  private static normalize(arguments_: readonly unknown[]):
    | {
        readonly isValid: true;
        readonly owner: IClass;
        readonly address: IDynamicClassMetadataAddress;
      }
    | { readonly isValid: false; readonly code: ICompilerMetadataRejectionCode } {
    const [target, suppliedMember, extra] = arguments_;
    const member = typeof suppliedMember === "number" ? String(suppliedMember) : suppliedMember;
    let owner: IClass | undefined;
    let side: "instance" | "static" = "static";
    if (MetadataTarget.isClass(target)) {
      owner = target;
    } else if (typeof target === "object" && target !== null) {
      owner = MetadataTarget.classOfPrototype(target);
      side = "instance";
    }
    if (owner === undefined) return { isValid: false, code: "invalid-decorator-target" };
    if (arguments_.length === 1 && side === "static") {
      return { isValid: true, owner, address: { kind: "class" } };
    }
    if (
      arguments_.length < 2 ||
      arguments_.length > 3 ||
      (typeof member !== "string" && typeof member !== "symbol") ||
      (extra !== undefined && (typeof extra !== "object" || extra === null))
    ) {
      return { isValid: false, code: "invalid-decorator-location" };
    }
    return { isValid: true, owner, address: { kind: "member", side, member } };
  }

  /** Accepts only compiler representations retained at runtime, not erased source types.
   * @param value Unknown compiler-emitted value to classify.
   * @returns True for a function or undefined; false for every other runtime value.
   */
  private static isRepresentation(value: unknown): value is IRuntimeType {
    return typeof value === "function" || value === undefined;
  }
}
