import { MetadataDefinitionOperations } from "./MetadataDefinitionOperations.js";
/** Defines invariant metadata whose nearest present declaration replaces the whole value.
 * Present undefined overrides ancestors; values retain identity and are trusted typed inputs.
 * @template T Value type stored and returned without cloning.
 */
export class ValueMetadataDefinition<in out T> extends MetadataDefinitionOperations<T, T> {
  /** Private marker that prevents structural identity sharing.
   * @default undefined
   */
  private brand: undefined;
  /** Readonly kind identifying whole-value replacement semantics. */
  public readonly kind: "value";
  /** Creates a fresh value definition identity.
   * @param name Descriptive label; it does not register or share this definition.
   */
  constructor(name: string) {
    super(name);
    this.kind = "value";
    void this.brand;
  }
  /** Retains the complete supplied value, including explicit undefined.
   * @param value Typed metadata value to store without cloning.
   * @returns The same value identity supplied by the caller.
   */
  protected override prepare(value: T): T {
    return value;
  }
}
