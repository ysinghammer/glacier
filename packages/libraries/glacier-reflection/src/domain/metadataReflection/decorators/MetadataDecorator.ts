import type { IClass } from "../targets/types/IClass.js";
import type { IDynamicClassMetadataAddress } from "../addressing/types/IDynamicClassMetadataAddress.js";
import { MetadataTarget } from "../targets/MetadataTarget.js";
import { MetadataBoundaryError } from "../failures/MetadataBoundary.error.js";

/** Translates legacy invocation shapes to constructor-owned metadata locations. */
export class MetadataDecorator {
  /** Inspects only canonical descriptors, never consumer getters or constructor bodies. */
  public static normalize(arguments_: readonly unknown[]): {
    readonly owner: IClass;
    readonly address: IDynamicClassMetadataAddress;
  } {
    const [target, suppliedMember, extra] = arguments_;
    const member = typeof suppliedMember === "number" ? String(suppliedMember) : suppliedMember;
    const targetInfo = MetadataDecorator.target(target);
    if (arguments_.length === 1 && targetInfo.side === "static")
      return { owner: targetInfo.owner, address: { kind: "class" } };
    MetadataDecorator.validateArity(arguments_.length);
    if (typeof extra === "number")
      return MetadataDecorator.parameter(targetInfo.owner, targetInfo.side, member, extra);
    return MetadataDecorator.member(targetInfo.owner, targetInfo.side, member, extra);
  }

  private static target(target: unknown): {
    readonly owner: IClass;
    readonly side: "instance" | "static";
  } {
    if (MetadataTarget.isClass(target)) return { owner: target, side: "static" };
    if (typeof target === "object" && target !== null) {
      const owner = MetadataTarget.classOfPrototype(target);
      if (owner !== undefined) return { owner, side: "instance" };
    }
    throw new MetadataBoundaryError("invalid-decorator-target");
  }

  private static validateArity(length: number): void {
    if (length < 2 || length > 3) throw new MetadataBoundaryError("invalid-decorator-location");
  }

  private static parameter(
    owner: IClass,
    side: "instance" | "static",
    member: unknown,
    position: number,
  ): { readonly owner: IClass; readonly address: IDynamicClassMetadataAddress } {
    if (member === undefined && side === "static")
      return { owner, address: { kind: "constructor-parameter", position } };
    if (typeof member === "string" || typeof member === "symbol")
      return { owner, address: { kind: "method-parameter", side, member, position } };
    throw new MetadataBoundaryError("invalid-decorator-location");
  }

  private static member(
    owner: IClass,
    side: "instance" | "static",
    member: unknown,
    extra: unknown,
  ): { readonly owner: IClass; readonly address: IDynamicClassMetadataAddress } {
    if (typeof member !== "string" && typeof member !== "symbol")
      throw new MetadataBoundaryError("invalid-decorator-location");
    if (extra !== undefined && (typeof extra !== "object" || extra === null))
      throw new MetadataBoundaryError("invalid-decorator-location");
    return { owner, address: { kind: "member", side, member } };
  }
}
