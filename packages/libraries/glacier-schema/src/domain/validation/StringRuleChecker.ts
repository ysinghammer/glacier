import type { IStringRules } from "../schema/IStringRules.js";
import type { IValueFailure } from "./IValueFailure.js";
import type { IValueOutcome } from "./IValueOutcome.js";
import { StringFormats } from "./StringFormats.js";

/** Normalises and checks one string value; created once per field at compile time. */
export type IStringRuleChecker = (value: string) => IValueOutcome;

/** Builds the checker for the constraints and normalisations of a string field. */
export class StringRuleChecker {
  /** Returns a checker that trims, lowercases, then reports the first violated constraint. */
  public static create(rules: IStringRules): IStringRuleChecker {
    const pattern =
      rules.pattern === undefined
        ? undefined
        : new RegExp(rules.pattern.source, rules.pattern.flags.replace(/[gy]/g, ""));
    return (input) => {
      let value = input;
      if (rules.trim === true) value = value.trim();
      if (rules.lowercase === true) value = value.toLowerCase();
      const failure = StringRuleChecker.#firstFailure(rules, pattern, value);
      return failure === undefined ? { isValid: true, value } : { isValid: false, failure };
    };
  }

  /** Returns the first violated rule in the order min, max, length, pattern, format. */
  static #firstFailure(
    rules: IStringRules,
    pattern: RegExp | undefined,
    value: string,
  ): IValueFailure | undefined {
    const { min, max, length, format } = rules;
    if (min !== undefined && value.length < min) {
      return StringRuleChecker.#tooSmall(min, false, value);
    }
    if (max !== undefined && value.length > max) {
      return StringRuleChecker.#tooBig(max, false, value);
    }
    if (length !== undefined && value.length < length) {
      return StringRuleChecker.#tooSmall(length, true, value);
    }
    if (length !== undefined && value.length > length) {
      return StringRuleChecker.#tooBig(length, true, value);
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

  /** Builds the failure of a value shorter than `limit`; `isExact` marks a `length` rule. */
  static #tooSmall(limit: number, isExact: boolean, value: string): IValueFailure {
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

  /** Builds the failure of a value longer than `limit`; `isExact` marks a `length` rule. */
  static #tooBig(limit: number, isExact: boolean, value: string): IValueFailure {
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
