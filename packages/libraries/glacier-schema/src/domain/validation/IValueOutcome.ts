import type { IValueFailure } from "./IValueFailure.js";

/** Result of validating one value: the accepted value or every reason it was rejected. */
export type IValueOutcome =
  | { readonly isValid: true; readonly value: unknown }
  | { readonly isValid: false; readonly failures: readonly IValueFailure[] };
