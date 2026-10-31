import type { IStringFormat } from "./IStringFormat.js";

/** Constraints and normalisations of a string field, applied in the order trim, lowercase, then the checks. */
export interface IStringRules {
  /** Minimum length in UTF-16 code units. */
  readonly min?: number;
  /** Maximum length in UTF-16 code units. */
  readonly max?: number;
  /** Exact length in UTF-16 code units; cannot be combined with `min` or `max`. */
  readonly length?: number;
  /** The value must match; flags `g` and `y` are ignored so matching stays stateless. */
  readonly pattern?: RegExp;
  /** The value must be a well-formed instance of the named format. */
  readonly format?: IStringFormat;
  /** Removes leading and trailing whitespace before the constraints are checked. */
  readonly trim?: boolean;
  /** Converts the value to lower case before the constraints are checked. */
  readonly lowercase?: boolean;
}
