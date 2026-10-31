import { MetadataDefinitionOperations } from "./MetadataDefinitionOperations.js";
/**
 * A distinct invariant definition for whole-value nearest-declaration replacement.
 * Present undefined overrides ancestors. Object/array values retain identity without cloning/freezing.
 * Own lookup excludes ancestors; custom values are trusted typed inputs.
 */
export class ValueMetadataDefinition<in out T> extends MetadataDefinitionOperations<T, T> {
  #brand: undefined;
  readonly kind: "value";
  /** Creates a fresh identity; the descriptive name never establishes sharing. */
  constructor(name: string) {
    super(name);
    this.kind = "value";
    void this.#brand;
  }
  /** Whole values retain their supplied identity, including explicit undefined. */
  protected override prepare(value: T): T {
    return value;
  }
}
