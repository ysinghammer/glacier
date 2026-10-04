import { DESIGN_TYPE_METADATA } from "../../../domain/DesignTypeMetadata.js";
import { DESIGN_PARAMETER_TYPES_METADATA } from "../../../domain/DesignParameterTypesMetadata.js";
import { DESIGN_RETURN_TYPE_METADATA } from "../../../domain/DesignReturnTypeMetadata.js";
import type { IRuntimeType } from "../../../domain/IRuntimeType.js";
import type { ICompilerMetadataRejectionCode } from "../../../domain/ICompilerMetadataRejectionCode.js";
import type { IClass } from "../../../domain/IClass.js";
import type { IDynamicClassMetadataAddress } from "../../../domain/IDynamicClassMetadataAddress.js";
import { MetadataTarget } from "../../../domain/MetadataTarget.js";

/** Validated compiler data, prepared completely before any class declaration changes. */
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

/** Checks the sole untyped input protocol without changing ordinary value-definition semantics. */
export class CompilerMetadataRecorder {
  /** Validates supported keys and snapshots every dense parameter entry before returning success. */
  static prepare(key: unknown, value: unknown): ICompilerDeclaration {
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

  /** Validates the complete class/member address before invoking an ordinary atomic set. */
  static record(
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

  /** Returns compiler-only address rejections; consumer inspection exceptions escape unchanged. */
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

  /** Narrows runtime representations without claiming constructability or erased source types. */
  private static isRepresentation(value: unknown): value is IRuntimeType {
    return typeof value === "function" || value === undefined;
  }
}
