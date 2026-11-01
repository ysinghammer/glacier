import type { ITypeSpec } from "../../schema/types/ITypeSpec.js";
import { CollectionValidatorFactory } from "./CollectionValidator.factory.js";
import type { IParseContext } from "../types/IParseContext.js";
import type { IValueFailure } from "../types/IValueFailure.js";
import type { IValueOutcome } from "../types/IValueOutcome.js";
import { NestedSchemaValidator } from "../NestedSchemaValidator.js";
import { NumberRuleChecker } from "../NumberRuleChecker.js";
import { StringRuleChecker } from "../StringRuleChecker.js";
import { TypeFailure } from "../TypeFailure.js";
import { UnionValidatorFactory } from "./UnionValidator.factory.js";
import { ValueCoercer } from "../ValueCoercer.js";
import { LogicalUnionNames } from "../LogicalUnionNames.js";

/**
 * Validates one value against a declared type without mutating it.
 * @param value Candidate value to validate.
 * @param context Per-parse coercion options and nesting depth.
 * @returns Accepted value or typed validation failures.
 */
export type IValueValidator = (value: unknown, context: IParseContext) => IValueOutcome;

/** Builds the validator closure for each supported field type. */
export class ValueValidatorFactory {
  /**
   * Builds the validator closure for a declared field type.
   * @param type Scalar, collection, nested-class or union type specification.
   * @returns Validator for values described by `type`.
   */
  public static create(type: ITypeSpec): IValueValidator {
    switch (type.kind) {
      case "string":
        return ValueValidatorFactory.withRules(
          ValueValidatorFactory.typeOf("string", "string"),
          StringRuleChecker.create(type.rules),
        );
      case "boolean":
        return ValueValidatorFactory.typeOf("boolean", "boolean");
      case "bigint":
        return ValueValidatorFactory.typeOf("bigint", "bigint");
      case "number":
        return ValueValidatorFactory.withRules(
          ValueValidatorFactory.number("number", Number.isFinite),
          NumberRuleChecker.create(type.rules),
        );
      case "int":
        return ValueValidatorFactory.withRules(
          ValueValidatorFactory.number("integer", Number.isInteger),
          NumberRuleChecker.create(type.rules),
        );
      case "date":
        return ValueValidatorFactory.date();
      case "literal":
        return ValueValidatorFactory.literal(type.value);
      case "enum":
        return ValueValidatorFactory.enumeration(type.values);
      case "any":
        return (value) => ({ isValid: true, value });
      case "array":
        return CollectionValidatorFactory.array(
          ValueValidatorFactory.create(type.element),
          type.rules,
          ValueCoercer.create(type.element),
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
          () => LogicalUnionNames.read(type.discriminator, type.variants),
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

  /**
   * Chains a rule checker after a type validator has accepted a value.
   * @template TValue Type narrowed by the type validator for the rule checker.
   * @param typeValidator Validator establishing the checker's input type.
   * @param checker Additional constraint checker for the narrowed value.
   * @returns Validator applying both checks in sequence.
   */
  private static withRules<TValue>(
    typeValidator: IValueValidator,
    checker: (value: TValue) => IValueOutcome,
  ): IValueValidator {
    return (value, context) => {
      const outcome = typeValidator(value, context);
      // The type validator only accepts values of the checker's type.
      return outcome.isValid ? checker(outcome.value as TValue) : outcome;
    };
  }

  /**
   * Wraps one failure in a rejected outcome.
   * @param failure Validation failure to preserve.
   * @returns Rejected outcome containing that failure.
   */
  private static reject(failure: IValueFailure): IValueOutcome {
    return { isValid: false, failures: [failure] };
  }

  /**
   * Builds a standard invalid-type outcome.
   * @param expected Expected runtime type label.
   * @param value Candidate value that failed the type check.
   * @returns Rejected outcome describing expected and received types.
   */
  private static invalidType(expected: string, value: unknown): IValueOutcome {
    return ValueValidatorFactory.reject(TypeFailure.invalidType(expected, value));
  }

  /**
   * Creates a validator matching a primitive `typeof` result.
   * @param expected Primitive typeof label to accept.
   * @param label Human-readable expected type in failures.
   * @returns Validator returning the original value or an invalid-type outcome.
   */
  private static typeOf(expected: "string" | "boolean" | "bigint", label: string): IValueValidator {
    return (value) =>
      typeof value === expected
        ? { isValid: true, value }
        : ValueValidatorFactory.invalidType(label, value);
  }

  /**
   * Creates a number validator with an additional acceptance predicate.
   * @param expected Human-readable numeric type label.
   * @param isAccepted Predicate for finite number or integer requirements.
   * @returns Validator returning the original number or an invalid-type outcome.
   */
  private static number(expected: string, isAccepted: (value: number) => boolean): IValueValidator {
    return (value) =>
      typeof value === "number" && isAccepted(value)
        ? { isValid: true, value }
        : ValueValidatorFactory.invalidType(expected, value);
  }

  /**
   * Creates a validator accepting valid Date instances.
   * @returns Validator distinguishing invalid instances from invalid date values.
   */
  private static date(): IValueValidator {
    return (value) => {
      if (!(value instanceof Date)) return ValueValidatorFactory.invalidType("date", value);
      if (Number.isNaN(value.getTime())) {
        return ValueValidatorFactory.reject({
          code: "invalid_date",
          message: "Invalid date",
          params: {},
        });
      }
      return { isValid: true, value };
    };
  }

  /**
   * Creates a strict-equality validator for one scalar literal.
   * @param expected Required literal value.
   * @returns Validator reporting an invalid-literal outcome for other values.
   */
  private static literal(expected: string | number | boolean | bigint | null): IValueValidator {
    return (value) =>
      value === expected
        ? { isValid: true, value }
        : ValueValidatorFactory.reject({
            code: "invalid_literal",
            message: `Invalid literal value, expected ${ValueValidatorFactory.show(expected)}`,
            params: { expected, received: value },
          });
  }

  /**
   * Creates a validator accepting only members of an enum value list.
   * @param values Allowed string and number values.
   * @returns Validator reporting the expected values on rejection.
   */
  private static enumeration(values: readonly (string | number)[]): IValueValidator {
    const allowed = new Set<unknown>(values);
    return (value) =>
      allowed.has(value)
        ? { isValid: true, value }
        : ValueValidatorFactory.reject({
            code: "invalid_enum_value",
            message: `Invalid enum value, expected one of: ${values.map((entry) => ValueValidatorFactory.show(entry)).join(", ")}`,
            params: { expected: values, received: value },
          });
  }

  /**
   * Formats a scalar literal for validation messages.
   * @param value Literal to render.
   * @returns Source-like string representation, including an `n` suffix for bigint.
   */
  private static show(value: string | number | boolean | bigint | null): string {
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "bigint") return `${value}n`;
    return String(value);
  }
}
