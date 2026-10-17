/** Constraints of a number or integer field, checked in the order listed. */
export interface INumberRules {
  /** Smallest accepted value, inclusive. */
  readonly min?: number;
  /** Largest accepted value, inclusive. */
  readonly max?: number;
  /** Values must be strictly greater than this. */
  readonly exclusiveMin?: number;
  /** Values must be strictly less than this. */
  readonly exclusiveMax?: number;
  /** Values must be an integer multiple of this positive number. */
  readonly multipleOf?: number;
}
