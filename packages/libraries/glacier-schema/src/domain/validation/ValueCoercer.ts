import type { ITypeSpec } from "../schema/ITypeSpec.js";

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
        return (value) => value;
    }
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
