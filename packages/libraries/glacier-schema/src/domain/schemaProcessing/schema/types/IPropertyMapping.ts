/** One effective object field's logical property and input/output wire name. */
export interface IPropertyMapping {
  /** Declared logical property name used on DTO instances. */
  readonly property: string;
  /** Effective wire name; `Rename` overrides the logical property name. */
  readonly wireName: string;
  /** Whether `Rename` explicitly supplies the wire name, even if it equals the property. */
  readonly isRenamed: boolean;
}
