import type { IDiscoveredMetadataAddress } from "./IDiscoveredMetadataAddress.js";
import type { IMetadataAddressRejection } from "./IMetadataAddressRejection.js";

/** An independent normalized address and lookup mode, never the caller's record. */
interface INormalizedMetadataAddress {
  readonly isValid: true;
  readonly address: IDiscoveredMetadataAddress;
  readonly inheritance: "own" | "inherited";
}

/** Validates exact address combinations before storage or lookup. */
export class MetadataAddress {
  /** Copies address fields, canonicalizing numeric names and omitted member sides. */
  static normalize(
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
    const kind = input.kind;
    const inheritance = MetadataAddress.lookup(input, isMutation, true);
    if (!inheritance.isValid) return inheritance;
    const allowed = ["kind"];
    if (!isMutation) allowed.push("inheritance");
    if (kind === "member" || kind === "method-parameter") allowed.push("side", "member");
    if (kind === "constructor-parameter" || kind === "method-parameter") allowed.push("position");
    if (Reflect.ownKeys(input).some((key) => typeof key !== "string" || !allowed.includes(key))) {
      return { isValid: false, code: "invalid-address" };
    }
    for (const field of ["side", "member", "position", "inheritance"]) {
      if (field in input && !allowed.includes(field)) {
        return { isValid: false, code: "invalid-address" };
      }
    }
    if (kind === "class") {
      return { isValid: true, address: { kind }, inheritance: inheritance.mode };
    }
    if (kind !== "member" && kind !== "method-parameter" && kind !== "constructor-parameter") {
      return { isValid: false, code: "invalid-address" };
    }
    let position = 0;
    if (kind !== "member") {
      if (!("position" in input)) return { isValid: false, code: "invalid-address" };
      const suppliedPosition = input.position;
      if (
        typeof suppliedPosition !== "number" ||
        !Number.isSafeInteger(suppliedPosition) ||
        suppliedPosition < 0
      ) {
        return { isValid: false, code: "invalid-position" };
      }
      position = suppliedPosition;
    }
    if (kind === "constructor-parameter") {
      if (isInstance) return { isValid: false, code: "instance-address-not-supported" };
      return { isValid: true, address: { kind, position }, inheritance: inheritance.mode };
    }
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
    return { isValid: true, address, inheritance: inheritance.mode };
  }

  /** Validates the separately supplied locations mode or an embedded read mode. */
  static lookup(
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
  static equals(first: IDiscoveredMetadataAddress, second: IDiscoveredMetadataAddress): boolean {
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
  static supportsInstance(address: IDiscoveredMetadataAddress): boolean {
    return (
      address.kind === "class" ||
      (address.kind !== "constructor-parameter" && address.side === "instance")
    );
  }
}
