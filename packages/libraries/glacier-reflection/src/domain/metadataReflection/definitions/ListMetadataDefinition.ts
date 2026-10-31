import { MetadataDefinitionOperations } from "./MetadataDefinitionOperations.js";
import type { IMetadataRead } from "./IMetadataRead.js";
/**
 * A distinct invariant definition for homogeneous ancestor-first list accumulation.
 * Duplicates remain; each set replaces only the direct contribution. Empty lists do not reset ancestors.
 * Input/output outer arrays are copied and shallow-frozen; contained values retain identity.
 */
export class ListMetadataDefinition<in out T> extends MetadataDefinitionOperations<
  readonly T[],
  readonly T[]
> {
  #brand: undefined;
  readonly kind: "list";
  /** Creates a fresh identity for homogeneous readonly contributions. */
  constructor(name: string) {
    super(name);
    this.kind = "list";
    void this.#brand;
  }
  /** Copies and shallow-freezes the contribution without cloning contained values. */
  protected override prepare(value: readonly T[]): readonly T[] {
    return Object.freeze([...value]);
  }
  /** Concatenates ancestor-first, preserving duplicates and present empty contributions. */
  protected override resolve(values: readonly (readonly T[])[]): IMetadataRead<readonly T[]> {
    if (values.length === 0) return { isValid: true, isPresent: false };
    const result: T[] = [];
    for (const value of values.toReversed()) result.push(...value);
    return { isValid: true, isPresent: true, value: Object.freeze(result) };
  }
}
