import type { IStringRules } from "../schema/types/IStringRules.js";
import type { IValueFailure } from "./types/IValueFailure.js";
import type { IValueOutcome } from "./types/IValueOutcome.js";
import { StringFormats } from "./StringFormats.js";

/**
 * Normalises and checks a string against declared field rules.
 * @param value String to normalize and validate.
 * @returns Normalized string on success or its first constraint failure.
 */
export type IStringRuleChecker = (value: string) => IValueOutcome;

/** Builds the checker for the constraints and normalisations of a string field. */
export class StringRuleChecker {
  /**
   * Creates a checker that applies normalisations before reporting the first failed rule.
   * @param rules String constraints and normalisations to apply.
   * @returns Checker yielding the normalised string on success or one typed failure.
   */
  public static create(rules: IStringRules): IStringRuleChecker {
    const pattern =
      rules.pattern === undefined
        ? undefined
        : new RegExp(rules.pattern.source, rules.pattern.flags.replace(/[gy]/g, ""));
    return (input) => {
      let value = input;
      if (rules.trim === true) value = value.trim();
      if (rules.lowercase === true) value = value.toLowerCase();
      const failure = StringRuleChecker.firstFailure(rules, pattern, value);
      return failure === undefined
        ? { isValid: true, value }
        : { isValid: false, failures: [failure] };
    };
  }

  /**
   * Finds the first failed rule in the order min, max, length, pattern, format.
   * @param rules Constraints used for the check.
   * @param pattern Pattern with stateful flags removed, when configured.
   * @param value Normalised string being checked.
   * @returns First constraint failure, or undefined when all rules pass.
   */
  private static firstFailure(
    rules: IStringRules,
    pattern: RegExp | undefined,
    value: string,
  ): IValueFailure | undefined {
    const { min, max, length, format } = rules;
    if (min !== undefined && value.length < min) {
      return StringRuleChecker.tooSmall(min, false, value);
    }
    if (max !== undefined && value.length > max) {
      return StringRuleChecker.tooBig(max, false, value);
    }
    if (length !== undefined && value.length < length) {
      return StringRuleChecker.tooSmall(length, true, value);
    }
    if (length !== undefined && value.length > length) {
      return StringRuleChecker.tooBig(length, true, value);
    }
    if (pattern !== undefined && !pattern.test(value)) {
      return {
        code: "invalid_format",
        message: `Invalid format, expected pattern ${pattern.toString()}`,
        params: { format: "pattern", pattern: pattern.source },
      };
    }
    if (format !== undefined && !StringFormats.matches(format, value)) {
      return {
        code: "invalid_format",
        message: `Invalid ${format}`,
        params: { format },
      };
    }
    return undefined;
  }

  /**
   * Builds the failure for a string shorter than its lower boundary.
   * @param limit Minimum or exact length configured by the rule.
   * @param isExact Whether the rule requires an exact length.
   * @param value Rejected string.
   * @returns Failure with length details.
   */
  private static tooSmall(limit: number, isExact: boolean, value: string): IValueFailure {
    return {
      code: "too_small",
      message: `String must contain ${isExact ? "exactly" : "at least"} ${limit} character(s)`,
      params: {
        type: "string",
        minimum: limit,
        inclusive: true,
        exact: isExact,
        received: value.length,
      },
    };
  }

  /**
   * Builds the failure for a string longer than its upper boundary.
   * @param limit Maximum or exact length configured by the rule.
   * @param isExact Whether the rule requires an exact length.
   * @param value Rejected string.
   * @returns Failure with length details.
   */
  private static tooBig(limit: number, isExact: boolean, value: string): IValueFailure {
    return {
      code: "too_big",
      message: `String must contain ${isExact ? "exactly" : "at most"} ${limit} character(s)`,
      params: {
        type: "string",
        maximum: limit,
        inclusive: true,
        exact: isExact,
        received: value.length,
      },
    };
  }
}
