import type { IValueCoercer } from "./ValueCoercer.js";
import type { IValueValidator } from "./ValueValidatorFactory.js";

/** One alternative of a non-discriminated union: how to validate a value and how to coerce it toward the option. */
export interface IOneOfOption {
  /** Validator of the option. */
  readonly validate: IValueValidator;
  /** Coercion toward the option, used only when the call enables `coerce`. */
  readonly coerce: IValueCoercer;
}
