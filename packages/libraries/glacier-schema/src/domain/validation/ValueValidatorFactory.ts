import type { ITypeSpec } from "../schema/ITypeSpec.js";
import { CollectionValidatorFactory } from "./CollectionValidatorFactory.js";
import type { IParseContext } from "./IParseContext.js";
import type { IValueFailure } from "./IValueFailure.js";
import type { IValueOutcome } from "./IValueOutcome.js";
import { NestedSchemaValidator } from "./NestedSchemaValidator.js";
import { NumberRuleChecker } from "./NumberRuleChecker.js";
import { StringRuleChecker } from "./StringRuleChecker.js";
import { TypeFailure } from "./TypeFailure.js";
import { UnionValidatorFactory } from "./UnionValidatorFactory.js";
import { ValueCoercer } from "./ValueCoercer.js";

/** Validates one value against a declared type; created once per field at compile time. */
export type IValueValidator = (value: unknown, context: IParseContext) => IValueOutcome;

/** Builds the validator closure for each supported field type. */
export class ValueValidatorFactory {
  /** Returns a validator that accepts exactly the values `type` declares and never mutates them. */
  public static create(type: ITypeSpec): IValueValidator {
    switch (type.kind) {
      case "string":
        return ValueValidatorFactory.#withRules(
          ValueValidatorFactory.#typeOf("string", "string"),
          StringRuleChecker.create(type.rules),
        );
      case "boolean":
        return ValueValidatorFactory.#typeOf("boolean", "boolean");
      case "bigint":
        return ValueValidatorFactory.#typeOf("bigint", "bigint");
      case "number":
        return ValueValidatorFactory.#withRules(
          ValueValidatorFactory.#number("number", Number.isFinite),
          NumberRuleChecker.create(type.rules),
        );
      case "int":
        return ValueValidatorFactory.#withRules(
          ValueValidatorFactory.#number("integer", Number.isInteger),
          NumberRuleChecker.create(type.rules),
        );
      case "date":
        return ValueValidatorFactory.#date();
      case "literal":
        return ValueValidatorFactory.#literal(type.value);
      case "enum":
        return ValueValidatorFactory.#enumeration(type.values);
      case "any":
        return (value) => ({ isValid: true, value });
      case "array":
        return CollectionValidatorFactory.array(
          ValueValidatorFactory.create(type.element),
          type.rules,
        );
      case "tuple":
        return CollectionValidatorFactory.tuple(type.elements.map(ValueValidatorFactory.create));
      case "set":
        return CollectionValidatorFactory.set(
          ValueValidatorFactory.create(type.element),
          type.rules,
        );
      case "map":
        return CollectionValidatorFactory.map(
          ValueValidatorFactory.create(type.key),
          ValueValidatorFactory.create(type.value),
          type.rules,
        );
      case "record":
        return CollectionValidatorFactory.record(
          ValueValidatorFactory.create(type.value),
          type.rules,
        );
      case "object":
        return NestedSchemaValidator.create(() => type.target);
      case "lazy":
        return NestedSchemaValidator.create(type.resolve);
      case "union":
        return UnionValidatorFactory.discriminated(
          type.discriminator,
          new Map(
            [...type.variants].map(([name, variant]) => [
              name,
              ValueValidatorFactory.create(variant),
            ]),
          ),
        );
      case "oneOf":
        return UnionValidatorFactory.oneOf(
          type.options.map((option) => ({
            validate: ValueValidatorFactory.create(option),
            coerce: ValueCoercer.create(option),
          })),
        );
    }
  }

  /** Runs `checker` on a value that already passed `typeValidator`. */
  static #withRules<TValue>(
    typeValidator: IValueValidator,
    checker: (value: TValue) => IValueOutcome,
  ): IValueValidator {
    return (value, context) => {
      const outcome = typeValidator(value, context);
      // The type validator only accepts values of the checker's type.
      return outcome.isValid ? checker(outcome.value as TValue) : outcome;
    };
  }

  /** Wraps one failure as a rejected outcome. */
  static #reject(failure: IValueFailure): IValueOutcome {
    return { isValid: false, failures: [failure] };
  }

  /** Builds the standard `invalid_type` rejection. */
  static #invalidType(expected: string, value: unknown): IValueOutcome {
    return ValueValidatorFactory.#reject(TypeFailure.invalidType(expected, value));
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
        return ValueValidatorFactory.#reject({
          code: "invalid_date",
          message: "Invalid date",
          params: {},
        });
      }
      return { isValid: true, value };
    };
  }

  /** Accepts only the literal, compared with strict equality. */
  static #literal(expected: string | number | boolean | bigint | null): IValueValidator {
    return (value) =>
      value === expected
        ? { isValid: true, value }
        : ValueValidatorFactory.#reject({
            code: "invalid_literal",
            message: `Invalid literal value, expected ${ValueValidatorFactory.#show(expected)}`,
            params: { expected, received: value },
          });
  }

  /** Accepts only the enum's values. */
  static #enumeration(values: readonly (string | number)[]): IValueValidator {
    const allowed = new Set<unknown>(values);
    return (value) =>
      allowed.has(value)
        ? { isValid: true, value }
        : ValueValidatorFactory.#reject({
            code: "invalid_enum_value",
            message: `Invalid enum value, expected one of: ${values.map((entry) => ValueValidatorFactory.#show(entry)).join(", ")}`,
            params: { expected: values, received: value },
          });
  }

  /** Renders a literal the way a developer would write it. */
  static #show(value: string | number | boolean | bigint | null): string {
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "bigint") return `${value}n`;
    return String(value);
  }
}
