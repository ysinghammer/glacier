import { MetadataDefinitionOperations } from "./MetadataDefinitionOperations.js";
import type { IMetadataRead } from "./types/IMetadataRead.js";
/** Defines invariant dictionary metadata with ancestor-first, whole-entry conflict replacement.
 * Own string entries snapshot/freeze; contained values retain identity and empty sets do not reset ancestors.
 * @template T Dictionary entry value type retained without cloning.
 */
export class RecordMetadataDefinition<in out T> extends MetadataDefinitionOperations<
  Readonly<Record<string, T>>,
  Readonly<Record<string, T | undefined>>
> {
  /** Private marker that prevents structural identity sharing.
   * @default undefined
   */
  private brand: undefined;
  /** Readonly kind identifying dictionary accumulation semantics. */
  public readonly kind: "record";
  /** Creates a fresh dictionary definition identity.
   * @param name Descriptive label; it does not register or share this definition.
   */
  constructor(name: string) {
    super(name);
    this.kind = "record";
    void this.brand;
  }
  /** Snapshots own enumerable string entries into a frozen null-prototype record.
   * @param value Typed dictionary contribution whose entry values retain identity.
   * @returns Frozen outer record; entries are copied without deep cloning.
   */
  protected override prepare(
    value: Readonly<Record<string, T>>,
  ): Readonly<Record<string, T | undefined>> {
    const result: Record<string, T | undefined> = {};
    Object.setPrototypeOf(result, null);
    for (const key of Object.keys(value)) result[key] = value[key];
    return Object.freeze(result);
  }
  /** Merges contributions ancestor-first, replacing complete entries from nearer declarations.
   * @param values Present contributions ordered nearest-first by storage.
   * @returns Absent for no declarations; otherwise a frozen merged record, including empty records.
   */
  protected override resolve(
    values: readonly Readonly<Record<string, T | undefined>>[],
  ): IMetadataRead<Readonly<Record<string, T | undefined>>> {
    if (values.length === 0) return { isValid: true, isPresent: false };
    const result: Record<string, T | undefined> = {};
    Object.setPrototypeOf(result, null);
    for (const value of values.toReversed()) {
      for (const key of Object.keys(value)) result[key] = value[key];
    }
    return { isValid: true, isPresent: true, value: Object.freeze(result) };
  }
}
