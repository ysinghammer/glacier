import type { ITypeSpec } from "../schema/ITypeSpec.js";
import type { IValueOutcome } from "./IValueOutcome.js";
import { ReceivedType } from "./ReceivedType.js";

/** Validates one value against a declared type; created once per field at compile time. */
export type IValueValidator = (value: unknown) => IValueOutcome;

/** Builds the validator closure for each supported field type. */
export class ValueValidatorFactory {
  /** Returns a validator that accepts exactly the values `type` declares and never mutates them. */
  public static create(type: ITypeSpec): IValueValidator {
    switch (type.kind) {
      case "string":
        return ValueValidatorFactory.#typeOf("string", "string");
      case "boolean":
        return ValueValidatorFactory.#typeOf("boolean", "boolean");
      case "bigint":
        return ValueValidatorFactory.#typeOf("bigint", "bigint");
      case "number":
        return ValueValidatorFactory.#number("number", Number.isFinite);
      case "int":
        return ValueValidatorFactory.#number("integer", Number.isInteger);
      case "date":
        return ValueValidatorFactory.#date();
      case "literal":
        return ValueValidatorFactory.#literal(type.value);
      case "enum":
        return ValueValidatorFactory.#enumeration(type.values);
      case "any":
        return (value) => ({ isValid: true, value });
    }
  }

  /** Builds the standard `invalid_type` rejection. */
  static #invalidType(expected: string, value: unknown): IValueOutcome {
    const received = ReceivedType.describe(value);
    return {
      isValid: false,
      failure: {
        code: "invalid_type",
        message: `Expected ${expected}, received ${received}`,
        params: { expected, received },
      },
    };
  }

  /** Accepts values whose `typeof` equals `expected`. */
  static #typeOf(expected: "string" | "boolean" | "bigint", label: string): IValueValidator {
    return (value) =>
      typeof value === expected
        ? { isValid: true, value }
        : ValueValidatorFactory.#invalidType(label, value);
  }

  /** Accepts finite numbers that also satisfy `isAccepted`; NaN and infinities are never numbers here. */
  static #number(expected: string, isAccepted: (value: number) => boolean): IValueValidator {
    return (value) =>
      typeof value === "number" && isAccepted(value)
        ? { isValid: true, value }
        : ValueValidatorFactory.#invalidType(expected, value);
  }

  /** Accepts valid `Date` instances; an `Invalid Date` is reported as `invalid_date`. */
  static #date(): IValueValidator {
    return (value) => {
      if (!(value instanceof Date)) return ValueValidatorFactory.#invalidType("date", value);
      if (Number.isNaN(value.getTime())) {
        return {
          isValid: false,
          failure: { code: "invalid_date", message: "Invalid date", params: {} },
        };
      }
      return { isValid: true, value };
    };
  }

  /** Accepts only the literal, compared with strict equality. */
  static #literal(expected: string | number | boolean | bigint | null): IValueValidator {
    return (value) =>
      value === expected
        ? { isValid: true, value }
        : {
            isValid: false,
            failure: {
              code: "invalid_literal",
              message: `Invalid literal value, expected ${ValueValidatorFactory.#show(expected)}`,
              params: { expected, received: value },
            },
          };
  }

  /** Accepts only the enum's values. */
  static #enumeration(values: readonly (string | number)[]): IValueValidator {
    const allowed = new Set<unknown>(values);
    return (value) =>
      allowed.has(value)
        ? { isValid: true, value }
        : {
            isValid: false,
            failure: {
              code: "invalid_enum_value",
              message: `Invalid enum value, expected one of: ${values.map((entry) => ValueValidatorFactory.#show(entry)).join(", ")}`,
              params: { expected: values, received: value },
            },
          };
  }

  /** Renders a literal the way a developer would write it. */
  static #show(value: string | number | boolean | bigint | null): string {
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "bigint") return `${value}n`;
    return String(value);
  }
}
