/** Entry-count constraints of a collection field. */
export interface ISizeRules {
  /** Smallest accepted number of entries, inclusive. */
  readonly min?: number;
  /** Largest accepted number of entries, inclusive. */
  readonly max?: number;
}
