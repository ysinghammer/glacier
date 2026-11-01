import type { ISizeRules } from "./ISizeRules.js";

/** Constraints of an array or set field, checked in the order size, elements, uniqueness. */
export interface ICollectionRules extends ISizeRules {
  /** Elements must be pairwise distinct; dates compare by time, other values by SameValueZero. */
  readonly unique?: boolean;
}
