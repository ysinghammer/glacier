import type { IClass } from "../targets/types/IClass.js";
import type { IDynamicClassMetadataAddress } from "../addressing/types/IDynamicClassMetadataAddress.js";
import { MetadataTarget } from "../targets/MetadataTarget.js";
import { MetadataBoundaryError } from "../failures/MetadataBoundary.error.js";

/** Converts legacy metadata callback arguments to constructor-owned canonical locations. */
export class MetadataDecorator {
  /** Converts class, member, accessor, and parameter callback forms into an owner/address pair.
   * @param arguments_ Legacy callback arguments received from the runtime.
   * @returns Constructor owner and corresponding dynamic address.
   * @remarks One-argument class callbacks select class metadata; numeric member keys become strings.
   * @remarks Proxy traps during target descriptor inspection may run and their failures propagate.
   */
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

  /** Resolves a constructor or canonical instance prototype to its owner and side.
   * @param target Callback target supplied by the decorator runtime.
   * @returns Constructor owner and static/instance side.
   * @throws {MetadataBoundaryError} If target is neither a class nor a canonical instance prototype.
   */
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

  /** Enforces the supported legacy callback argument counts.
   * @param length Number of callback arguments supplied by the runtime.
   * @returns No value; valid lengths are two or three.
   * @throws {MetadataBoundaryError} If fewer than two or more than three arguments were supplied.
   */
  private static validateArity(length: number): void {
    if (length < 2 || length > 3) throw new MetadataBoundaryError("invalid-decorator-location");
  }

  /** Builds constructor- or method-parameter location from the legacy callback shape.
   * @param owner Constructor that owns the decorated declaration.
   * @param side Static or instance member side selected from the callback target.
   * @param member Member key; undefined identifies a static constructor parameter.
   * @param position Zero-based parameter position supplied by the runtime.
   * @returns Constructor-parameter or method-parameter address for the owner.
   * @throws {MetadataBoundaryError} If member and side do not form a supported parameter location.
   */
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

  /** Builds a property or method address after validating legacy descriptor arguments.
   * @param owner Constructor that owns the decorated declaration.
   * @param side Static or instance member side selected from the callback target.
   * @param member Member key supplied by the runtime.
   * @param extra Optional third argument; a supplied descriptor must be an object and is not read.
   * @returns Canonical member address for the owner.
   * @throws {MetadataBoundaryError} If member is not a string/symbol or extra is non-object.
   */
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
