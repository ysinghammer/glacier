import type { ICollectionRules } from "../../schema/types/ICollectionRules.js";
import type { ISizeRules } from "../../schema/types/ISizeRules.js";
import type { IParseContext } from "../types/IParseContext.js";
import type { IValueFailure } from "../types/IValueFailure.js";
import type { IValueOutcome } from "../types/IValueOutcome.js";
import { PlainObject } from "../PlainObject.js";
import { TypeFailure } from "../TypeFailure.js";
import type { IValueValidator } from "./ValueValidator.factory.js";
import type { IValueCoercer } from "../ValueCoercer.js";

/** Collection labels used to construct human-readable size failures. */
type ICollectionLabel = "Array" | "Tuple" | "Set" | "Map" | "Record";

/** Indices identifying a repeated value and its first occurrence. */
interface IDuplicate {
  /** Zero-based index of the first matching value. */
  readonly firstIndex: number;
  /** Zero-based index of the later matching value. */
  readonly duplicateIndex: number;
}

/** Builds the validators of arrays, tuples, sets, maps and records from their element validators. */
export class CollectionValidatorFactory {
  /**
   * Builds an array validator that checks size, entries and optional uniqueness.
   * @param element Validator applied to each array entry.
   * @param rules Array size and uniqueness constraints.
   * @param coerceElement Optional coercer used for promoted singleton values when coercion is enabled.
   * @returns Validator producing a new array of accepted entries.
   */
  public static array(
    element: IValueValidator,
    rules: ICollectionRules,
    coerceElement?: IValueCoercer,
  ): IValueValidator {
    return (value, context) => {
      if (
        context.options.coerceSingletonArrays === true &&
        value !== undefined &&
        value !== null &&
        typeof value !== "object"
      )
        value = [
          context.options.coerce === true && coerceElement !== undefined
            ? coerceElement(value)
            : value,
        ];
      if (!Array.isArray(value))
        return CollectionValidatorFactory.reject(TypeFailure.invalidType("array", value));
      const items: readonly unknown[] = value;
      return CollectionValidatorFactory.validateList("Array", items, element, rules, context);
    };
  }

  /**
   * Builds a tuple validator requiring exactly one entry per element validator.
   * @param elements Validators applied at corresponding tuple positions.
   * @returns Validator producing a tuple-shaped array or positional failures.
   */
  public static tuple(elements: readonly IValueValidator[]): IValueValidator {
    return (value, context) => {
      if (!Array.isArray(value))
        return CollectionValidatorFactory.reject(TypeFailure.invalidType("array", value));
      const items: readonly unknown[] = value;
      const exact = CollectionValidatorFactory.sizeFailure(
        "Tuple",
        "array",
        { min: elements.length, max: elements.length },
        items.length,
        true,
      );
      if (exact !== undefined) return CollectionValidatorFactory.reject(exact);
      const failures: IValueFailure[] = [];
      const output = elements.map((validator, index) =>
        CollectionValidatorFactory.validateAt(validator, items[index], index, context, failures),
      );
      return CollectionValidatorFactory.outcome(output, failures);
    };
  }

  /**
   * Builds a set validator that checks entries and optional uniqueness.
   * @param element Validator applied to each set member.
   * @param rules Set size and uniqueness constraints.
   * @returns Validator producing a new Set of accepted entries.
   */
  public static set(element: IValueValidator, rules: ICollectionRules): IValueValidator {
    return (value, context) => {
      if (!(value instanceof Set))
        return CollectionValidatorFactory.reject(TypeFailure.invalidType("set", value));
      const outcome = CollectionValidatorFactory.validateList(
        "Set",
        [...value],
        element,
        rules,
        context,
      );
      return outcome.isValid
        ? { isValid: true, value: new Set(outcome.value as unknown[]) }
        : outcome;
    };
  }

  /**
   * Builds a map validator checking entry count, keys and values.
   * @param key Validator applied to every map key.
   * @param value Validator applied to every map value.
   * @param rules Minimum and maximum entry counts.
   * @returns Validator producing a new Map and recording key failures at their entry paths.
   */
  public static map(
    key: IValueValidator,
    value: IValueValidator,
    rules: ISizeRules,
  ): IValueValidator {
    return (input, context) => {
      if (!(input instanceof Map))
        return CollectionValidatorFactory.reject(TypeFailure.invalidType("map", input));
      const entries: readonly (readonly [unknown, unknown])[] = [...input];
      const size = CollectionValidatorFactory.sizeFailure(
        "Map",
        "map",
        rules,
        entries.length,
        false,
      );
      if (size !== undefined) return CollectionValidatorFactory.reject(size);
      const failures: IValueFailure[] = [];
      const output = new Map<unknown, unknown>();
      for (const [index, [entryKey, entryValue]] of entries.entries()) {
        const segment =
          typeof entryKey === "string" || typeof entryKey === "number" ? entryKey : index;
        const validKey = CollectionValidatorFactory.validateAt(
          key,
          entryKey,
          segment,
          context,
          failures,
          "key",
        );
        const validValue = CollectionValidatorFactory.validateAt(
          value,
          entryValue,
          segment,
          context,
          failures,
        );
        output.set(validKey, validValue);
      }
      return CollectionValidatorFactory.outcome(output, failures);
    };
  }

  /**
   * Builds a validator for a plain object used as a string-keyed dictionary.
   * @param value Validator applied to each own enumerable value.
   * @param rules Minimum and maximum entry counts.
   * @returns Validator producing a new plain object and preserving value issue paths.
   */
  public static record(value: IValueValidator, rules: ISizeRules): IValueValidator {
    return (input, context) => {
      if (!PlainObject.is(input))
        return CollectionValidatorFactory.reject(TypeFailure.invalidType("object", input));
      const keys = Object.keys(input);
      const size = CollectionValidatorFactory.sizeFailure(
        "Record",
        "record",
        rules,
        keys.length,
        false,
      );
      if (size !== undefined) return CollectionValidatorFactory.reject(size);
      const failures: IValueFailure[] = [];
      const output: Record<string, unknown> = {};
      for (const key of keys) {
        const accepted = CollectionValidatorFactory.validateAt(
          value,
          input[key],
          key,
          context,
          failures,
        );
        // defineProperty keeps a "__proto__" key an own property instead of changing the prototype.
        Object.defineProperty(output, key, {
          value: accepted,
          enumerable: true,
          writable: true,
          configurable: true,
        });
      }
      return CollectionValidatorFactory.outcome(output, failures);
    };
  }

  /**
   * Validates array or set entries after checking collection size.
   * @param label Collection name used in messages and metadata.
   * @param items Snapshot of collection entries in iteration order.
   * @param element Validator applied to every entry.
   * @param rules Size and optional uniqueness constraints.
   * @param context Per-parse options and nesting depth.
   * @returns Accepted entry array or all entry/uniqueness failures.
   */
  private static validateList(
    label: "Array" | "Set",
    items: readonly unknown[],
    element: IValueValidator,
    rules: ICollectionRules,
    context: IParseContext,
  ): IValueOutcome {
    const type = label === "Array" ? "array" : "set";
    const size = CollectionValidatorFactory.sizeFailure(label, type, rules, items.length, false);
    if (size !== undefined) return CollectionValidatorFactory.reject(size);
    const failures: IValueFailure[] = [];
    // Array.from visits holes of sparse arrays, which `map` would skip.
    const output = Array.from(items, (item, index) =>
      CollectionValidatorFactory.validateAt(element, item, index, context, failures),
    );
    if (failures.length > 0) return { isValid: false, failures };
    const duplicate =
      rules.unique === true ? CollectionValidatorFactory.firstDuplicate(output) : undefined;
    if (duplicate !== undefined) {
      return CollectionValidatorFactory.reject({
        code: "not_unique",
        message: `${label} must contain unique items`,
        params: { type, ...duplicate },
        path: [duplicate.duplicateIndex],
      });
    }
    return { isValid: true, value: output };
  }

  /**
   * Validates one collection entry and prefixes failures with its path segment.
   * @param validator Entry validator.
   * @param item Candidate entry value.
   * @param segment Key or zero-based position used in failure paths.
   * @param context Per-parse options and nesting depth.
   * @param failures Mutable accumulator receiving entry failures.
   * @param location Marks map-key failures when supplied.
   * @returns Accepted entry value, or undefined when rejected.
   */
  private static validateAt(
    validator: IValueValidator,
    item: unknown,
    segment: string | number,
    context: IParseContext,
    failures: IValueFailure[],
    location?: "key",
  ): unknown {
    const outcome = validator(item, context);
    if (outcome.isValid) return outcome.value;
    for (const failure of outcome.failures) {
      failures.push({
        ...failure,
        path: [segment, ...(failure.path ?? [])],
        params: location === undefined ? failure.params : { ...failure.params, location },
      });
    }
    return undefined;
  }

  /**
   * Combines a candidate result with its accumulated failures.
   * @param value Candidate collection result.
   * @param failures Failures collected while validating its entries.
   * @returns Success carrying `value` when empty, otherwise a rejected outcome.
   */
  private static outcome(value: unknown, failures: readonly IValueFailure[]): IValueOutcome {
    return failures.length === 0 ? { isValid: true, value } : { isValid: false, failures };
  }

  /**
   * Wraps one failure in a rejected outcome.
   * @param failure Failure to include.
   * @returns Rejected outcome containing the failure.
   */
  private static reject(failure: IValueFailure): IValueOutcome {
    return { isValid: false, failures: [failure] };
  }

  /**
   * Builds an entry-count failure when a collection violates its size bounds.
   * @param label Display name of the collection kind.
   * @param type Stable collection type value included in issue parameters.
   * @param rules Minimum and maximum entry counts.
   * @param count Actual number of entries.
   * @param isExact Whether the configured bounds require one exact size.
   * @returns Size failure, or undefined when the count is valid.
   */
  private static sizeFailure(
    label: ICollectionLabel,
    type: string,
    rules: ISizeRules,
    count: number,
    isExact: boolean,
  ): IValueFailure | undefined {
    const { min, max } = rules;
    const quantity = isExact ? "exactly" : undefined;
    if (min !== undefined && count < min) {
      return {
        code: "too_small",
        message: `${label} must contain ${quantity ?? "at least"} ${min} item(s)`,
        params: { type, minimum: min, inclusive: true, exact: isExact, received: count },
      };
    }
    if (max !== undefined && count > max) {
      return {
        code: "too_big",
        message: `${label} must contain ${quantity ?? "at most"} ${max} item(s)`,
        params: { type, maximum: max, inclusive: true, exact: isExact, received: count },
      };
    }
    return undefined;
  }

  /**
   * Finds the first repeated element, comparing dates by timestamp and others by SameValueZero.
   * @param values Validated entries in collection order.
   * @returns First and duplicate indices, or undefined when all values are distinct.
   */
  private static firstDuplicate(values: readonly unknown[]): IDuplicate | undefined {
    const seen = new Map<unknown, number>();
    for (const [index, value] of values.entries()) {
      const identity = value instanceof Date ? `date:${value.getTime()}` : value;
      const firstIndex = seen.get(identity);
      if (firstIndex !== undefined) return { firstIndex, duplicateIndex: index };
      seen.set(identity, index);
    }
    return undefined;
  }
}
