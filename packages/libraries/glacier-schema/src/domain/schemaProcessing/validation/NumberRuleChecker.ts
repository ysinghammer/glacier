import type { INumberRules } from "../schema/types/INumberRules.js";
import type { IValueFailure } from "./types/IValueFailure.js";
import type { IValueOutcome } from "./types/IValueOutcome.js";

/**
 * Checks numeric constraints on one value accepted by the type validator.
 * @param value Finite number to check.
 * @returns Accepted number or its first constraint failure.
 */
export type INumberRuleChecker = (value: number) => IValueOutcome;

/** Builds the checker for the constraints of a number or integer field. */
export class NumberRuleChecker {
  /**
   * Creates a checker that reports the first violated numeric constraint.
   * @param rules Bounds and divisibility rules to apply in declaration order.
   * @returns Checker yielding the input on success or one typed failure.
   */
  public static create(rules: INumberRules): INumberRuleChecker {
    return (value) => {
      const failure = NumberRuleChecker.firstFailure(rules, value);
      return failure === undefined
        ? { isValid: true, value }
        : { isValid: false, failures: [failure] };
    };
  }

  /**
   * Finds the earliest violated rule in the order min, max, exclusiveMin, exclusiveMax, multipleOf.
   * @param rules Numeric constraints to inspect.
   * @param value Finite number already accepted by the type validator.
   * @returns First constraint failure, or undefined when all rules pass.
   */
  private static firstFailure(rules: INumberRules, value: number): IValueFailure | undefined {
    const { min, max, exclusiveMin, exclusiveMax, multipleOf } = rules;
    if (min !== undefined && value < min) return NumberRuleChecker.tooSmall(min, true, value);
    if (max !== undefined && value > max) return NumberRuleChecker.tooBig(max, true, value);
    if (exclusiveMin !== undefined && value <= exclusiveMin) {
      return NumberRuleChecker.tooSmall(exclusiveMin, false, value);
    }
    if (exclusiveMax !== undefined && value >= exclusiveMax) {
      return NumberRuleChecker.tooBig(exclusiveMax, false, value);
    }
    if (multipleOf !== undefined && !NumberRuleChecker.isMultiple(value, multipleOf)) {
      return {
        code: "not_multiple_of",
        message: `Number must be a multiple of ${multipleOf}`,
        params: { multipleOf, received: value },
      };
    }
    return undefined;
  }

  /**
   * Tests divisibility while tolerating scaled binary floating-point error.
   * @param value Number being checked.
   * @param divisor Positive multiple size.
   * @returns Whether the quotient is sufficiently close to an integer.
   */
  private static isMultiple(value: number, divisor: number): boolean {
    const quotient = value / divisor;
    const nearest = Math.round(quotient);
    return Math.abs(quotient - nearest) <= Number.EPSILON * Math.max(1, Math.abs(nearest));
  }

  /**
   * Builds the failure for a value below its lower bound.
   * @param limit Lower boundary from the violated rule.
   * @param isInclusive Whether equality with the boundary is accepted.
   * @param value Rejected number.
   * @returns Failure with bound and received-value details.
   */
  private static tooSmall(limit: number, isInclusive: boolean, value: number): IValueFailure {
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

  /**
   * Builds the failure for a value above its upper bound.
   * @param limit Upper boundary from the violated rule.
   * @param isInclusive Whether equality with the boundary is accepted.
   * @param value Rejected number.
   * @returns Failure with bound and received-value details.
   */
  private static tooBig(limit: number, isInclusive: boolean, value: number): IValueFailure {
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
