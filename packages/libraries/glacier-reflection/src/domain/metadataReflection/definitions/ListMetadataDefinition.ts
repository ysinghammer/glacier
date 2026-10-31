import { MetadataDefinitionOperations } from "./MetadataDefinitionOperations.js";
import type { IMetadataRead } from "./types/IMetadataRead.js";
/** Defines invariant list metadata by ancestor-first concatenation, preserving duplicates.
 * Contributions replace only their direct declaration; frozen outer arrays retain item identities.
 * @template T List item type retained without cloning.
 */
export class ListMetadataDefinition<in out T> extends MetadataDefinitionOperations<
  readonly T[],
  readonly T[]
> {
  /** Private marker that prevents structural identity sharing.
   * @default undefined
   */
  private brand: undefined;
  /** Readonly kind identifying list accumulation semantics. */
  public readonly kind: "list";
  /** Creates a fresh list definition identity.
   * @param name Descriptive label; it does not register or share this definition.
   */
  constructor(name: string) {
    super(name);
    this.kind = "list";
    void this.brand;
  }
  /** Copies and shallow-freezes one contribution without cloning its items.
   * @param value Readonly list contribution supplied by the typed caller.
   * @returns Frozen outer array retaining each item identity.
   */
  protected override prepare(value: readonly T[]): readonly T[] {
    return Object.freeze([...value]);
  }
  /** Concatenates present contributions ancestor-first, retaining duplicates and empty presence.
   * @param values Present contributions ordered nearest-first by storage.
   * @returns Absent for no declarations; otherwise a frozen concatenated list.
   */
  protected override resolve(values: readonly (readonly T[])[]): IMetadataRead<readonly T[]> {
    if (values.length === 0) return { isValid: true, isPresent: false };
    const result: T[] = [];
    for (const value of values.toReversed()) result.push(...value);
    return { isValid: true, isPresent: true, value: Object.freeze(result) };
  }
}
