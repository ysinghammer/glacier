import type { ITypeSpec } from "../schema/ITypeSpec.js";
import { PlainObject } from "./PlainObject.js";

/** Converts a raw input value toward the declared type; unconvertible values are returned unchanged. */
export type IValueCoercer = (value: unknown) => unknown;

const NUMERIC_TEXT = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
const INTEGER_TEXT = /^[+-]?\d+$/;
const ISO_DATE_TEXT =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/i;

/** Builds the per-type coercion used when a call passes `{ coerce: true }`. */
export class ValueCoercer {
  /** Returns the coercer for `type`; it never throws and never touches `null` or `undefined`. */
  public static create(type: ITypeSpec): IValueCoercer {
    switch (type.kind) {
      case "string":
        return ValueCoercer.#toString;
      case "number":
      case "int":
        return ValueCoercer.#toNumber;
      case "boolean":
        return ValueCoercer.#toBoolean;
      case "bigint":
        return ValueCoercer.#toBigInt;
      case "date":
        return ValueCoercer.#toDate;
      case "literal":
        return ValueCoercer.#toAllowed(new Set<unknown>([type.value]));
      case "enum":
        return ValueCoercer.#toAllowed(new Set<unknown>(type.values));
      case "any":
      case "object":
      case "lazy":
        // Nested classes coerce their own fields when they are parsed.
        return (value) => value;
      case "array":
        return ValueCoercer.#toArray(ValueCoercer.create(type.element));
      case "tuple":
        return ValueCoercer.#toTuple(type.elements.map(ValueCoercer.create));
      case "set":
        return ValueCoercer.#toSet(ValueCoercer.create(type.element));
      case "map":
        return ValueCoercer.#toMap(ValueCoercer.create(type.key), ValueCoercer.create(type.value));
      case "record":
        return ValueCoercer.#toRecord(ValueCoercer.create(type.value));
    }
  }

  /** Applies `coerce` to an entry unless it is `null` or `undefined`. */
  static #coerceEntry(coerce: IValueCoercer, entry: unknown): unknown {
    return entry === undefined || entry === null ? entry : coerce(entry);
  }

  /** Coerces every element of an array; anything else is left for validation to reject. */
  static #toArray(element: IValueCoercer): IValueCoercer {
    return (value) =>
      Array.isArray(value)
        ? Array.from(value as unknown[], (item) => ValueCoercer.#coerceEntry(element, item))
        : value;
  }

  /** Coerces the positions of an array that have an element type; extra positions stay unchanged. */
  static #toTuple(elements: readonly IValueCoercer[]): IValueCoercer {
    return (value) =>
      Array.isArray(value)
        ? Array.from(value as unknown[], (item, index) => {
            const coerce = elements[index];
            return coerce === undefined ? item : ValueCoercer.#coerceEntry(coerce, item);
          })
        : value;
  }

  /** Turns arrays and sets of convertible elements into a set of coerced elements. */
  static #toSet(element: IValueCoercer): IValueCoercer {
    return (value) =>
      Array.isArray(value) || value instanceof Set
        ? new Set(
            Array.from(value as Iterable<unknown>, (item) =>
              ValueCoercer.#coerceEntry(element, item),
            ),
          )
        : value;
  }

  /** Turns maps, arrays of `[key, value]` pairs and plain objects into a map of coerced keys and values. */
  static #toMap(key: IValueCoercer, element: IValueCoercer): IValueCoercer {
    return (value) => {
      const entries = ValueCoercer.#entriesOf(value);
      if (entries === undefined) return value;
      return new Map(
        entries.map(([entryKey, entryValue]) => [
          ValueCoercer.#coerceEntry(key, entryKey),
          ValueCoercer.#coerceEntry(element, entryValue),
        ]),
      );
    };
  }

  /** Lists the entries of a map, an array made only of pairs, or a plain object; otherwise `undefined`. */
  static #entriesOf(value: unknown): readonly (readonly [unknown, unknown])[] | undefined {
    if (value instanceof Map) return [...value];
    if (PlainObject.is(value)) return Object.entries(value);
    if (!Array.isArray(value)) return undefined;
    const isPair = (entry: unknown): entry is readonly [unknown, unknown] =>
      Array.isArray(entry) && entry.length === 2;
    return value.every(isPair) ? value : undefined;
  }

  /** Coerces the values of a plain object into a new plain object. */
  static #toRecord(element: IValueCoercer): IValueCoercer {
    return (value) =>
      PlainObject.is(value)
        ? Object.fromEntries(
            Object.entries(value).map(([key, item]) => [
              key,
              ValueCoercer.#coerceEntry(element, item),
            ]),
          )
        : value;
  }

  /** Numbers, booleans and bigints become their string form. */
  static readonly #toString: IValueCoercer = (value) =>
    typeof value === "number" || typeof value === "boolean" || typeof value === "bigint"
      ? String(value)
      : value;

  /** Decimal strings become numbers; empty or non-decimal text such as `"0x10"` is left alone. */
  static readonly #toNumber: IValueCoercer = (value) =>
    typeof value === "string" && NUMERIC_TEXT.test(value.trim()) ? Number(value) : value;

  /** Only `"true"` and `"false"`, in any case, become booleans. */
  static readonly #toBoolean: IValueCoercer = (value) => {
    if (typeof value !== "string") return value;
    const text = value.toLowerCase();
    if (text === "true") return true;
    return text === "false" ? false : value;
  };

  /** Integer strings and safe integers become bigints. */
  static readonly #toBigInt: IValueCoercer = (value) => {
    if (typeof value === "string" && INTEGER_TEXT.test(value)) return BigInt(value);
    return Number.isSafeInteger(value) ? BigInt(value as number) : value;
  };

  /** ISO 8601 strings and finite timestamps become dates; an impossible calendar date stays invalid. */
  static readonly #toDate: IValueCoercer = (value) => {
    if (typeof value === "string" && ISO_DATE_TEXT.test(value)) return new Date(value);
    return typeof value === "number" && Number.isFinite(value) ? new Date(value) : value;
  };

  /** Tries each conversion and keeps the first result that is one of the allowed values. */
  static #toAllowed(allowed: ReadonlySet<unknown>): IValueCoercer {
    const conversions = [
      ValueCoercer.#toNumber,
      ValueCoercer.#toBoolean,
      ValueCoercer.#toBigInt,
      ValueCoercer.#toString,
    ];
    return (value) => {
      if (allowed.has(value)) return value;
      const converted = conversions.map((convert) => convert(value));
      return converted.find((candidate) => allowed.has(candidate)) ?? value;
    };
  }
}
