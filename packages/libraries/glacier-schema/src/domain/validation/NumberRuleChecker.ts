import type { INumberRules } from "../schema/INumberRules.js";
import type { IValueFailure } from "./IValueFailure.js";
import type { IValueOutcome } from "./IValueOutcome.js";

/** Checks one finite number; created once per field at compile time. */
export type INumberRuleChecker = (value: number) => IValueOutcome;

/** Builds the checker for the constraints of a number or integer field. */
export class NumberRuleChecker {
  /** Returns a checker that reports the first violated constraint in the order of `INumberRules`. */
  public static create(rules: INumberRules): INumberRuleChecker {
    return (value) => {
      const failure = NumberRuleChecker.#firstFailure(rules, value);
      return failure === undefined
        ? { isValid: true, value }
        : { isValid: false, failures: [failure] };
    };
  }

  /** Returns the first violated rule in the order min, max, exclusiveMin, exclusiveMax, multipleOf. */
  static #firstFailure(rules: INumberRules, value: number): IValueFailure | undefined {
    const { min, max, exclusiveMin, exclusiveMax, multipleOf } = rules;
    if (min !== undefined && value < min) return NumberRuleChecker.#tooSmall(min, true, value);
    if (max !== undefined && value > max) return NumberRuleChecker.#tooBig(max, true, value);
    if (exclusiveMin !== undefined && value <= exclusiveMin) {
      return NumberRuleChecker.#tooSmall(exclusiveMin, false, value);
    }
    if (exclusiveMax !== undefined && value >= exclusiveMax) {
      return NumberRuleChecker.#tooBig(exclusiveMax, false, value);
    }
    if (multipleOf !== undefined && !NumberRuleChecker.#isMultiple(value, multipleOf)) {
      return {
        code: "not_multiple_of",
        message: `Number must be a multiple of ${multipleOf}`,
        params: { multipleOf, received: value },
      };
    }
    return undefined;
  }

  /** Tolerates binary floating-point error, so `0.3` is a multiple of `0.1`. */
  static #isMultiple(value: number, divisor: number): boolean {
    const quotient = value / divisor;
    const nearest = Math.round(quotient);
    return Math.abs(quotient - nearest) <= Number.EPSILON * Math.max(1, Math.abs(nearest));
  }

  /** Builds the failure of a value below the bound; `isInclusive` is false for `exclusiveMin`. */
  static #tooSmall(limit: number, isInclusive: boolean, value: number): IValueFailure {
    return {
      code: "too_small",
      message: `Number must be greater than ${isInclusive ? "or equal to " : ""}${limit}`,
      params: {
        type: "number",
        minimum: limit,
        inclusive: isInclusive,
        received: value,
      },
    };
  }

  /** Builds the failure of a value above the bound; `isInclusive` is false for `exclusiveMax`. */
  static #tooBig(limit: number, isInclusive: boolean, value: number): IValueFailure {
    return {
      code: "too_big",
      message: `Number must be less than ${isInclusive ? "or equal to " : ""}${limit}`,
      params: {
        type: "number",
        maximum: limit,
        inclusive: isInclusive,
        received: value,
      },
    };
  }
}
