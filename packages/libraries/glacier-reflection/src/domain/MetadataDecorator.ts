import type { IClass } from "./IClass.js";
import type { IDynamicClassMetadataAddress } from "./IDynamicClassMetadataAddress.js";
import { MetadataTarget } from "./MetadataTarget.js";
import { MetadataBoundaryError } from "./MetadataBoundary.error.js";

/** Translates legacy invocation shapes to constructor-owned metadata locations. */
export class MetadataDecorator {
  /** Inspects only canonical descriptors, never consumer getters or constructor bodies. */
  static normalize(arguments_: readonly unknown[]): {
    readonly owner: IClass;
    readonly address: IDynamicClassMetadataAddress;
  } {
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
    if (owner === undefined) throw new MetadataBoundaryError("invalid-decorator-target");
    if (arguments_.length === 1 && side === "static") {
      return { owner, address: { kind: "class" } };
    }
    if (arguments_.length < 2 || arguments_.length > 3) {
      throw new MetadataBoundaryError("invalid-decorator-location");
    }
    if (typeof extra === "number") {
      if (member === undefined && side === "static") {
        return { owner, address: { kind: "constructor-parameter", position: extra } };
      }
      if (typeof member === "string" || typeof member === "symbol") {
        return { owner, address: { kind: "method-parameter", side, member, position: extra } };
      }
      throw new MetadataBoundaryError("invalid-decorator-location");
    }
    if (
      (typeof member !== "string" && typeof member !== "symbol") ||
      (extra !== undefined && (typeof extra !== "object" || extra === null))
    ) {
      throw new MetadataBoundaryError("invalid-decorator-location");
    }
    return { owner, address: { kind: "member", side, member } };
  }
}
