import type { IDiscoveredMetadataAddress } from "./types/IDiscoveredMetadataAddress.js";
import type { IMetadataAddressRejection } from "./types/IMetadataAddressRejection.js";

/** A validated canonical address paired with its effective inheritance mode.
 * @property isValid Readonly success discriminator, true after valid normalization.
 * @property address Readonly detached canonical location used by storage operations.
 * @property inheritance Readonly effective mode; omitted lookup resolves to inherited.
 */
interface INormalizedMetadataAddress {
  readonly isValid: true;
  readonly address: IDiscoveredMetadataAddress;
  readonly inheritance: "own" | "inherited";
}

/** Field allowlist selected for one dynamic address variant.
 * @property kind Readonly recognized variant whose fields are allowed.
 * @property fields Readonly exact string keys accepted for that variant and operation.
 */
type IAllowedMetadataAddress =
  | { readonly kind: "class"; readonly fields: readonly string[] }
  | { readonly kind: "member"; readonly fields: readonly string[] }
  | { readonly kind: "method-parameter"; readonly fields: readonly string[] }
  | { readonly kind: "constructor-parameter"; readonly fields: readonly string[] };

/** Validates dynamic metadata locations and converts accepted inputs to canonical addresses. */
export class MetadataAddress {
  /** Validates and detaches an address, canonicalizing numeric names and omitted member sides.
   * @param input Untrusted address; undefined selects the class location.
   * @param isMutation True for writes/deletes, which reject lookup modes.
   * @param isInstance True when a class instance alias restricts allowed locations.
   * @returns Canonical address and mode, or a typed validation rejection.
   * @remarks Input getters and proxy traps used during inspection may run; their failures propagate.
   */
  public static normalize(
    input: unknown,
    isMutation: boolean,
    isInstance: boolean,
  ): INormalizedMetadataAddress | IMetadataAddressRejection {
    if (input === undefined) {
      return { isValid: true, address: { kind: "class" }, inheritance: "inherited" };
    }
    if (typeof input !== "object" || input === null || !("kind" in input)) {
      return { isValid: false, code: "invalid-address" };
    }
    return MetadataAddress.normalizeObject(input, isMutation, isInstance);
  }

  /** Validates allowed own fields, then builds a detached canonical address.
   * @param input Object already narrowed to a non-null object with a kind field.
   * @param isMutation True for writes/deletes, which reject lookup modes.
   * @param isInstance True when an instance alias restricts allowed locations.
   * @returns Canonical address and mode, or a typed validation rejection.
   */
  private static normalizeObject(
    input: object,
    isMutation: boolean,
    isInstance: boolean,
  ): INormalizedMetadataAddress | IMetadataAddressRejection {
    const kind = Reflect.get(input, "kind");
    const inheritance = MetadataAddress.lookup(input, isMutation, true);
    if (!inheritance.isValid) return inheritance;
    const allowed = MetadataAddress.allowedFields(kind, isMutation);
    if (allowed === undefined || !MetadataAddress.hasOnlyAllowedFields(input, allowed.fields))
      return { isValid: false, code: "invalid-address" };
    if (allowed.kind === "class") {
      return { isValid: true, address: { kind: allowed.kind }, inheritance: inheritance.mode };
    }
    if (allowed.kind === "constructor-parameter") {
      if (isInstance) return { isValid: false, code: "instance-address-not-supported" };
      const position = MetadataAddress.position(input);
      if (!position.isValid) return position;
      return {
        isValid: true,
        address: { kind: allowed.kind, position: position.value },
        inheritance: inheritance.mode,
      };
    }
    const position =
      allowed.kind === "member"
        ? { isValid: true as const, value: 0 }
        : MetadataAddress.position(input);
    if (!position.isValid) return position;
    return MetadataAddress.memberAddress(
      input,
      allowed.kind,
      position.value,
      inheritance.mode,
      isInstance,
    );
  }

  /** Returns the accepted fields for a recognized address kind and operation.
   * @param kind Untrusted discriminator to match against supported kinds.
   * @param isMutation True when inheritance fields are not permitted.
   * @returns The variant field allowlist, or undefined for an unknown kind.
   */
  private static allowedFields(
    kind: unknown,
    isMutation: boolean,
  ): IAllowedMetadataAddress | undefined {
    if (
      kind !== "class" &&
      kind !== "member" &&
      kind !== "method-parameter" &&
      kind !== "constructor-parameter"
    )
      return undefined;
    const allowed = ["kind"];
    if (!isMutation) allowed.push("inheritance");
    if (kind === "member" || kind === "method-parameter") allowed.push("side", "member");
    if (kind === "constructor-parameter" || kind === "method-parameter") allowed.push("position");
    return { kind, fields: allowed };
  }

  /** Rejects symbol and unknown own keys, including forbidden known fields.
   * @param input Address object whose own keys and known fields are checked.
   * @param allowed String field names permitted for its address variant.
   * @returns True only when every supplied own key is allowed.
   */
  private static hasOnlyAllowedFields(input: object, allowed: readonly string[]): boolean {
    for (const key of Reflect.ownKeys(input))
      if (typeof key !== "string" || !allowed.includes(key)) return false;
    for (const field of ["side", "member", "position", "inheritance"])
      if (field in input && !allowed.includes(field)) return false;
    return true;
  }

  /** Validates a required safe nonnegative integer parameter position.
   * @param input Address object expected to contain a position field.
   * @returns The valid numeric position, or a typed address rejection.
   */
  private static position(
    input: object,
  ): { readonly isValid: true; readonly value: number } | IMetadataAddressRejection {
    if (!("position" in input)) return { isValid: false, code: "invalid-address" };
    const position: unknown = input.position;
    if (typeof position !== "number" || !Number.isSafeInteger(position) || position < 0)
      return { isValid: false, code: "invalid-position" };
    return { isValid: true, value: position };
  }

  /** Validates member-side restrictions and returns the canonical member location.
   * @param input Address object supplying side and member fields.
   * @param kind Member or method-parameter location being built.
   * @param position Canonical parameter position; zero for member addresses.
   * @param inheritance Effective lookup mode selected during normalization.
   * @param isInstance True when static locations are unavailable.
   * @returns Canonical member address, or a typed validation rejection.
   */
  private static memberAddress(
    input: object,
    kind: "member" | "method-parameter",
    position: number,
    inheritance: "own" | "inherited",
    isInstance: boolean,
  ): INormalizedMetadataAddress | IMetadataAddressRejection {
    const side = "side" in input ? input.side : "instance";
    if (side !== "instance" && side !== "static") {
      return { isValid: false, code: "invalid-address" };
    }
    if (!("member" in input)) return { isValid: false, code: "invalid-address" };
    const suppliedMember = input.member;
    if (
      typeof suppliedMember !== "string" &&
      typeof suppliedMember !== "symbol" &&
      typeof suppliedMember !== "number"
    ) {
      return { isValid: false, code: "invalid-address" };
    }
    const member = typeof suppliedMember === "number" ? String(suppliedMember) : suppliedMember;
    if (side === "static" && member === "prototype") {
      return { isValid: false, code: "invalid-address" };
    }
    if (isInstance && side === "static") {
      return { isValid: false, code: "instance-address-not-supported" };
    }
    const address: IDiscoveredMetadataAddress =
      kind === "member" ? { kind, side, member } : { kind, side, member, position };
    return { isValid: true, address, inheritance };
  }

  /** Validates a lookup option or embedded read mode; mutations cannot select inheritance.
   * @param input Untrusted lookup record; undefined selects inherited lookup.
   * @param isMutation True when the operation forbids explicit mode; defaults false.
   * @param isEmbedded True when other address fields may accompany mode; defaults false.
   * @default isMutation=false; isEmbedded=false.
   * @returns Effective lookup mode, or a typed address rejection.
   * @remarks Input getters and proxy traps used during inspection may run; their failures propagate.
   */
  public static lookup(
    input: unknown,
    isMutation = false,
    isEmbedded = false,
  ): { readonly isValid: true; readonly mode: "own" | "inherited" } | IMetadataAddressRejection {
    if (input === undefined) return { isValid: true, mode: "inherited" };
    if (typeof input !== "object" || input === null) {
      return { isValid: false, code: "invalid-address" };
    }
    if (!isEmbedded && Reflect.ownKeys(input).some((key) => key !== "inheritance")) {
      return { isValid: false, code: "invalid-address" };
    }
    if (!("inheritance" in input)) return { isValid: true, mode: "inherited" };
    const mode = input.inheritance;
    if (isMutation || (mode !== "own" && mode !== "inherited")) {
      return { isValid: false, code: "invalid-address" };
    }
    return { isValid: true, mode };
  }

  /** Compares canonical location identity without stringifying symbol member keys.
   * @param first First canonical location to compare.
   * @param second Second canonical location to compare.
   * @returns Whether both locations identify the same metadata address.
   */
  public static equals(
    first: IDiscoveredMetadataAddress,
    second: IDiscoveredMetadataAddress,
  ): boolean {
    if (first.kind !== second.kind) return false;
    if (first.kind === "class" && second.kind === "class") return true;
    if (first.kind === "constructor-parameter" && second.kind === "constructor-parameter") {
      return first.position === second.position;
    }
    if (first.kind === "member" && second.kind === "member") {
      return first.side === second.side && first.member === second.member;
    }
    return (
      first.kind === "method-parameter" &&
      second.kind === "method-parameter" &&
      first.side === second.side &&
      first.member === second.member &&
      first.position === second.position
    );
  }

  /** Reports whether an address is available through an instance alias.
   * @param address Canonical location to check.
   * @returns True for class or instance-side locations, false otherwise.
   */
  public static supportsInstance(address: IDiscoveredMetadataAddress): boolean {
    return (
      address.kind === "class" ||
      (address.kind !== "constructor-parameter" && address.side === "instance")
    );
  }
}
