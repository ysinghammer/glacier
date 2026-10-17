import type { ICollectionRules } from "../schema/ICollectionRules.js";
import type { ISizeRules } from "../schema/ISizeRules.js";
import type { IParseContext } from "./IParseContext.js";
import type { IValueFailure } from "./IValueFailure.js";
import type { IValueOutcome } from "./IValueOutcome.js";
import { PlainObject } from "./PlainObject.js";
import { TypeFailure } from "./TypeFailure.js";
import type { IValueValidator } from "./ValueValidatorFactory.js";

type ICollectionLabel = "Array" | "Tuple" | "Set" | "Map" | "Record";

/** A repeated element and the first element it equals. */
interface IDuplicate {
  readonly firstIndex: number;
  readonly duplicateIndex: number;
}

/** Builds the validators of arrays, tuples, sets, maps and records from their element validators. */
export class CollectionValidatorFactory {
  /**
   * Returns a validator for arrays: type, then size, then every element, then uniqueness when requested.
   * The accepted value is a new array of the validated elements.
   */
  public static array(element: IValueValidator, rules: ICollectionRules): IValueValidator {
    return (value, context) => {
      if (!Array.isArray(value))
        return CollectionValidatorFactory.#reject(TypeFailure.invalidType("array", value));
      const items: readonly unknown[] = value;
      return CollectionValidatorFactory.#validateList("Array", items, element, rules, context);
    };
  }

  /** Returns a validator for arrays of exactly `elements.length` entries, each checked by its own validator. */
  public static tuple(elements: readonly IValueValidator[]): IValueValidator {
    return (value, context) => {
      if (!Array.isArray(value))
        return CollectionValidatorFactory.#reject(TypeFailure.invalidType("array", value));
      const items: readonly unknown[] = value;
      const exact = CollectionValidatorFactory.#sizeFailure(
        "Tuple",
        "array",
        { min: elements.length, max: elements.length },
        items.length,
        true,
      );
      if (exact !== undefined) return CollectionValidatorFactory.#reject(exact);
      const failures: IValueFailure[] = [];
      const output = elements.map((validator, index) =>
        CollectionValidatorFactory.#validateAt(validator, items[index], index, context, failures),
      );
      return CollectionValidatorFactory.#outcome(output, failures);
    };
  }

  /** Returns a validator for sets; like arrays, but the accepted value is a new `Set`. */
  public static set(element: IValueValidator, rules: ICollectionRules): IValueValidator {
    return (value, context) => {
      if (!(value instanceof Set))
        return CollectionValidatorFactory.#reject(TypeFailure.invalidType("set", value));
      const outcome = CollectionValidatorFactory.#validateList(
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

  /** Returns a validator for maps; keys and values are validated and the accepted value is a new `Map`. */
  public static map(
    key: IValueValidator,
    value: IValueValidator,
    rules: ISizeRules,
  ): IValueValidator {
    return (input, context) => {
      if (!(input instanceof Map))
        return CollectionValidatorFactory.#reject(TypeFailure.invalidType("map", input));
      const entries: readonly (readonly [unknown, unknown])[] = [...input];
      const size = CollectionValidatorFactory.#sizeFailure(
        "Map",
        "map",
        rules,
        entries.length,
        false,
      );
      if (size !== undefined) return CollectionValidatorFactory.#reject(size);
      const failures: IValueFailure[] = [];
      const output = new Map<unknown, unknown>();
      for (const [index, [entryKey, entryValue]] of entries.entries()) {
        const segment =
          typeof entryKey === "string" || typeof entryKey === "number" ? entryKey : index;
        const validKey = CollectionValidatorFactory.#validateAt(
          key,
          entryKey,
          segment,
          context,
          failures,
          "key",
        );
        const validValue = CollectionValidatorFactory.#validateAt(
          value,
          entryValue,
          segment,
          context,
          failures,
        );
        output.set(validKey, validValue);
      }
      return CollectionValidatorFactory.#outcome(output, failures);
    };
  }

  /** Returns a validator for plain objects used as string-keyed dictionaries of one value type. */
  public static record(value: IValueValidator, rules: ISizeRules): IValueValidator {
    return (input, context) => {
      if (!PlainObject.is(input))
        return CollectionValidatorFactory.#reject(TypeFailure.invalidType("object", input));
      const keys = Object.keys(input);
      const size = CollectionValidatorFactory.#sizeFailure(
        "Record",
        "record",
        rules,
        keys.length,
        false,
      );
      if (size !== undefined) return CollectionValidatorFactory.#reject(size);
      const failures: IValueFailure[] = [];
      const output: Record<string, unknown> = {};
      for (const key of keys) {
        const accepted = CollectionValidatorFactory.#validateAt(
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
      return CollectionValidatorFactory.#outcome(output, failures);
    };
  }

  /** Shared body of arrays and sets: size, then elements, then uniqueness. */
  static #validateList(
    label: "Array" | "Set",
    items: readonly unknown[],
    element: IValueValidator,
    rules: ICollectionRules,
    context: IParseContext,
  ): IValueOutcome {
    const type = label === "Array" ? "array" : "set";
    const size = CollectionValidatorFactory.#sizeFailure(label, type, rules, items.length, false);
    if (size !== undefined) return CollectionValidatorFactory.#reject(size);
    const failures: IValueFailure[] = [];
    // Array.from visits holes of sparse arrays, which `map` would skip.
    const output = Array.from(items, (item, index) =>
      CollectionValidatorFactory.#validateAt(element, item, index, context, failures),
    );
    if (failures.length > 0) return { isValid: false, failures };
    const duplicate =
      rules.unique === true ? CollectionValidatorFactory.#firstDuplicate(output) : undefined;
    if (duplicate !== undefined) {
      return CollectionValidatorFactory.#reject({
        code: "not_unique",
        message: `${label} must contain unique items`,
        params: { type, ...duplicate },
        path: [duplicate.duplicateIndex],
      });
    }
    return { isValid: true, value: output };
  }

  /** Validates one entry and records its failures prefixed with `segment`; returns the accepted value. */
  static #validateAt(
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

  /** Accepts `value` when no entry failed, otherwise reports every failure. */
  static #outcome(value: unknown, failures: readonly IValueFailure[]): IValueOutcome {
    return failures.length === 0 ? { isValid: true, value } : { isValid: false, failures };
  }

  /** Wraps one failure as a rejected outcome. */
  static #reject(failure: IValueFailure): IValueOutcome {
    return { isValid: false, failures: [failure] };
  }

  /** Builds the failure of an entry count outside `rules`; `isExact` marks the fixed length of a tuple. */
  static #sizeFailure(
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

  /** Finds the first element equal to an earlier one; dates compare by time, others by SameValueZero. */
  static #firstDuplicate(values: readonly unknown[]): IDuplicate | undefined {
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
