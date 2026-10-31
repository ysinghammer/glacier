import type { IValueCoercer } from "../ValueCoercer.js";
import type { IValueValidator } from "../factories/ValueValidator.factory.js";

/** One alternative of a non-discriminated union: how to validate a value and how to coerce it toward the option. */
export interface IOneOfOption {
  /**
   * Validator of this union alternative.
   * @param value Candidate value to validate.
   * @param context Per-parse options and nesting depth.
   * @returns Accepted value or failures from this alternative.
   */
  readonly validate: IValueValidator;
  /**
   * Coercer toward this option, used only after exact alternatives fail and coercion is enabled.
   * @param value Candidate value to convert.
   * @returns Converted candidate or unchanged input when not coercible.
   */
  readonly coerce: IValueCoercer;
}
