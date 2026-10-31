import type { IDiscoveredMetadataAddress } from "./types/IDiscoveredMetadataAddress.js";
import type { IMetadataAddressRejection } from "./types/IMetadataAddressRejection.js";

/** An independent normalized address and lookup mode, never the caller's record. */
interface INormalizedMetadataAddress {
  readonly isValid: true;
  readonly address: IDiscoveredMetadataAddress;
  readonly inheritance: "own" | "inherited";
}

type IAllowedMetadataAddress =
  | { readonly kind: "class"; readonly fields: readonly string[] }
  | { readonly kind: "member"; readonly fields: readonly string[] }
  | { readonly kind: "method-parameter"; readonly fields: readonly string[] }
  | { readonly kind: "constructor-parameter"; readonly fields: readonly string[] };

/** Validates exact address combinations before storage or lookup. */
export class MetadataAddress {
  /** Copies address fields, canonicalizing numeric names and omitted member sides. */
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

  private static hasOnlyAllowedFields(input: object, allowed: readonly string[]): boolean {
    for (const key of Reflect.ownKeys(input))
      if (typeof key !== "string" || !allowed.includes(key)) return false;
    for (const field of ["side", "member", "position", "inheritance"])
      if (field in input && !allowed.includes(field)) return false;
    return true;
  }

  private static position(
    input: object,
  ): { readonly isValid: true; readonly value: number } | IMetadataAddressRejection {
    if (!("position" in input)) return { isValid: false, code: "invalid-address" };
    const position: unknown = input.position;
    if (typeof position !== "number" || !Number.isSafeInteger(position) || position < 0)
      return { isValid: false, code: "invalid-position" };
    return { isValid: true, value: position };
  }

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

  /** Validates the separately supplied locations mode or an embedded read mode. */
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

  /** Compares canonical location identity without stringifying symbol keys. */
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

  /** Selects only class and instance-side locations for instance aliases. */
  public static supportsInstance(address: IDiscoveredMetadataAddress): boolean {
    return (
      address.kind === "class" ||
      (address.kind !== "constructor-parameter" && address.side === "instance")
    );
  }
}
