import type { ITypeSpec } from "../schema/types/ITypeSpec.js";
import { PlainObject } from "./PlainObject.js";

/**
 * Converts raw input toward a declared type, leaving unconvertible values unchanged.
 * @param value Raw input value to convert.
 * @returns Converted scalar or collection, or the original value when unsupported.
 */
export type IValueCoercer = (value: unknown) => unknown;

const NUMERIC_TEXT = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
const INTEGER_TEXT = /^[+-]?\d+$/;
const ISO_DATE_TEXT =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/i;

/** Builds the per-type coercion used when a call passes `{ coerce: true }`. */
export class ValueCoercer {
  /**
   * Builds the coercer for one declared type.
   * @param type Scalar, collection, object or union specification to coerce toward.
   * @returns Coercer that leaves nullish and unsupported values unchanged.
   */
  public static create(type: ITypeSpec): IValueCoercer {
    switch (type.kind) {
      case "string":
        return ValueCoercer.toString;
      case "number":
      case "int":
        return ValueCoercer.toNumber;
      case "boolean":
        return ValueCoercer.toBoolean;
      case "bigint":
        return ValueCoercer.toBigInt;
      case "date":
        return ValueCoercer.toDate;
      case "literal":
        return ValueCoercer.toAllowed(new Set<unknown>([type.value]));
      case "enum":
        return ValueCoercer.toAllowed(new Set<unknown>(type.values));
      case "any":
      case "object":
      case "lazy":
      case "union":
      case "oneOf":
        // Nested classes coerce their own fields when they are parsed, and a one-of tries coercion per option.
        return (value) => value;
      case "array":
        return ValueCoercer.toArray(ValueCoercer.create(type.element));
      case "tuple":
        return ValueCoercer.toTuple(type.elements.map(ValueCoercer.create));
      case "set":
        return ValueCoercer.toSet(ValueCoercer.create(type.element));
      case "map":
        return ValueCoercer.toMap(ValueCoercer.create(type.key), ValueCoercer.create(type.value));
      case "record":
        return ValueCoercer.toRecord(ValueCoercer.create(type.value));
    }
  }

  /**
   * Applies a coercer to a non-nullish collection entry.
   * @param coerce Coercer selected for the entry type.
   * @param entry Raw entry value.
   * @returns Unchanged nullish entry or its coerced value.
   */
  private static coerceEntry(coerce: IValueCoercer, entry: unknown): unknown {
    return entry === undefined || entry === null ? entry : coerce(entry);
  }

  /**
   * Creates a coercer for arrays of one element type.
   * @param element Coercer applied to each array entry.
   * @returns Coercer preserving non-array inputs for validation.
   */
  private static toArray(element: IValueCoercer): IValueCoercer {
    return (value) =>
      Array.isArray(value)
        ? Array.from(value as unknown[], (item) => ValueCoercer.coerceEntry(element, item))
        : value;
  }

  /**
   * Creates a coercer for the declared positions of a tuple.
   * @param elements Coercers aligned to tuple positions.
   * @returns Coercer preserving extra tuple entries and non-array inputs.
   */
  private static toTuple(elements: readonly IValueCoercer[]): IValueCoercer {
    return (value) =>
      Array.isArray(value)
        ? Array.from(value as unknown[], (item, index) => {
            const coerce = elements[index];
            return coerce === undefined ? item : ValueCoercer.coerceEntry(coerce, item);
          })
        : value;
  }

  /**
   * Creates a set coercer accepting array or set input.
   * @param element Coercer applied to each member.
   * @returns Coercer producing a new Set for supported inputs.
   */
  private static toSet(element: IValueCoercer): IValueCoercer {
    return (value) =>
      Array.isArray(value) || value instanceof Set
        ? new Set(
            Array.from(value as Iterable<unknown>, (item) =>
              ValueCoercer.coerceEntry(element, item),
            ),
          )
        : value;
  }

  /**
   * Creates a map coercer for maps, pair arrays and plain-object entries.
   * @param key Coercer applied to each key.
   * @param element Coercer applied to each value.
   * @returns Coercer producing a new Map for supported inputs.
   */
  private static toMap(key: IValueCoercer, element: IValueCoercer): IValueCoercer {
    return (value) => {
      const entries = ValueCoercer.entriesOf(value);
      if (entries === undefined) return value;
      return new Map(
        entries.map(([entryKey, entryValue]) => [
          ValueCoercer.coerceEntry(key, entryKey),
          ValueCoercer.coerceEntry(element, entryValue),
        ]),
      );
    };
  }

  /**
   * Extracts entries from a supported map-like input.
   * @param value Candidate map, pair array or plain object.
   * @returns Entry snapshot, or undefined when the input shape is unsupported.
   */
  private static entriesOf(value: unknown): readonly (readonly [unknown, unknown])[] | undefined {
    if (value instanceof Map) return [...value];
    if (PlainObject.is(value)) return Object.entries(value);
    if (!Array.isArray(value)) return undefined;
    const isPair = (entry: unknown): entry is readonly [unknown, unknown] =>
      Array.isArray(entry) && entry.length === 2;
    return value.every(isPair) ? value : undefined;
  }

  /**
   * Creates a dictionary coercer that transforms own enumerable values.
   * @param element Coercer applied to each dictionary value.
   * @returns Coercer producing a new plain object for plain-object inputs.
   */
  private static toRecord(element: IValueCoercer): IValueCoercer {
    return (value) =>
      PlainObject.is(value)
        ? Object.fromEntries(
            Object.entries(value).map(([key, item]) => [
              key,
              ValueCoercer.coerceEntry(element, item),
            ]),
          )
        : value;
  }

  /** Converts number, boolean and bigint values to strings; other inputs pass through. */
  private static readonly toString: IValueCoercer = (value) =>
    typeof value === "number" || typeof value === "boolean" || typeof value === "bigint"
      ? String(value)
      : value;

  /** Converts decimal numeric text to a number; non-decimal or non-string inputs pass through. */
  private static readonly toNumber: IValueCoercer = (value) =>
    typeof value === "string" && NUMERIC_TEXT.test(value.trim()) ? Number(value) : value;

  /** Converts case-insensitive `true` and `false` strings; other inputs pass through. */
  private static readonly toBoolean: IValueCoercer = (value) => {
    if (typeof value !== "string") return value;
    const text = value.toLowerCase();
    if (text === "true") return true;
    return text === "false" ? false : value;
  };

  /** Converts integer strings and safe integer numbers to bigint; other inputs pass through. */
  private static readonly toBigInt: IValueCoercer = (value) => {
    if (typeof value === "string" && INTEGER_TEXT.test(value)) return BigInt(value);
    return Number.isSafeInteger(value) ? BigInt(value as number) : value;
  };

  /** Converts ISO date text and finite timestamps to Date values; other inputs pass through. */
  private static readonly toDate: IValueCoercer = (value) => {
    if (typeof value === "string" && ISO_DATE_TEXT.test(value)) return new Date(value);
    return typeof value === "number" && Number.isFinite(value) ? new Date(value) : value;
  };

  /**
   * Creates a coercer trying supported scalar conversions against an allowed-value set.
   * @param allowed Set of accepted literal or enum values.
   * @returns Coercer selecting the first converted value in the set, or preserving input.
   */
  private static toAllowed(allowed: ReadonlySet<unknown>): IValueCoercer {
    const conversions = [
      ValueCoercer.toNumber,
      ValueCoercer.toBoolean,
      ValueCoercer.toBigInt,
      ValueCoercer.toString,
    ];
    return (value) => {
      if (allowed.has(value)) return value;
      const converted = conversions.map((convert) => convert(value));
      return converted.find((candidate) => allowed.has(candidate)) ?? value;
    };
  }
}
