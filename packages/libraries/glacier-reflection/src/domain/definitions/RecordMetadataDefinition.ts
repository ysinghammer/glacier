import { MetadataDefinitionOperations } from "./MetadataDefinitionOperations.js";
import type { IMetadataRead } from "./IMetadataRead.js";
/**
 * A distinct invariant homogeneous dictionary definition; read entries may be absent.
 * Own enumerable string entries accumulate ancestor-first; conflicts replace whole entries, never deep-merge.
 * Outer null-prototype dictionaries snapshot/freeze, including reserved keys; contained values retain identity.
 * Repeated sets replace direct contributions; empty records cannot suppress ancestors.
 */
export class RecordMetadataDefinition<in out T> extends MetadataDefinitionOperations<
  Readonly<Record<string, T>>,
  Readonly<Record<string, T | undefined>>
> {
  #brand: undefined;
  readonly kind: "record";
  /** Creates a fresh identity with whole-entry nearest replacement on conflicts. */
  constructor(name: string) {
    super(name);
    this.kind = "record";
    void this.#brand;
  }
  /** Snapshots only own enumerable string entries, retaining contained value identities. */
  protected override prepare(
    value: Readonly<Record<string, T>>,
  ): Readonly<Record<string, T | undefined>> {
    const result: Record<string, T | undefined> = {};
    Object.setPrototypeOf(result, null);
    for (const key of Object.keys(value)) result[key] = value[key];
    return Object.freeze(result);
  }
  /** Accumulates ancestor-first with whole-entry replacement and no inheritance reset. */
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
