import { ErrorSerializer } from "./ErrorSerializer.js";

const MAX_VALUE_DEPTH = 32;
const CIRCULAR_PLACEHOLDER = "[Circular]";
const MAX_DEPTH_PLACEHOLDER = "[Max depth]";
const UNSERIALIZABLE_PLACEHOLDER = "[Unserializable]";
const UNDEFINED_PLACEHOLDER = "[undefined]";
const FUNCTION_PLACEHOLDER = "[Function]";
const SYMBOL_PLACEHOLDER = "[Symbol]";
const INVALID_DATE_PLACEHOLDER = "[Invalid Date]";

/** Converts values to JSON-compatible data, substituting placeholders for unreadable values. */
export class SafeValueSerializer {
  /** Serializes own enumerable record properties while preserving their keys.
   * @param record - Structured data to serialize without mutation.
   * @returns A plain record containing JSON-compatible values or placeholders.
   */
  public static serializeRecord(
    record: Readonly<Record<string, unknown>>,
  ): Record<string, unknown> {
    return SafeValueSerializer.serializeProperties(
      record,
      Object.keys(record),
      new Set([record]),
      1,
    );
  }

  /** Serializes a value while recognizing objects already active in the traversal.
   * @param value - Value to convert.
   * @param ancestors - Active objects used to detect circular references.
   * @param depth - Current traversal depth, used for the maximum-depth limit.
   * @returns A safe scalar, array, record, or placeholder for unsupported data.
   */
  public static serializeWithin(value: unknown, ancestors: Set<object>, depth: number): unknown {
    try {
      return SafeValueSerializer.serializeUnsafe(value, ancestors, depth);
    } catch {
      return UNSERIALIZABLE_PLACEHOLDER;
    }
  }

  /** Reads and serializes named properties, replacing a getter failure with a placeholder.
   * @param target - Object that owns the requested properties.
   * @param keys - Property names to read in the supplied order.
   * @param ancestors - Active objects used to detect circular references.
   * @param depth - Current traversal depth for nested values.
   * @returns A plain record containing serialized values for the requested keys.
   */
  public static serializeProperties(
    target: object,
    keys: readonly string[],
    ancestors: Set<object>,
    depth: number,
  ): Record<string, unknown> {
    const entries = keys.map((key): [string, unknown] => {
      try {
        const propertyValue: unknown = Reflect.get(target, key);
        return [key, SafeValueSerializer.serializeWithin(propertyValue, ancestors, depth)];
      } catch {
        return [key, UNSERIALIZABLE_PLACEHOLDER];
      }
    });
    return Object.fromEntries(entries);
  }

  /** Converts one value by type; the public wrapper replaces failures with a placeholder.
   * @param value - Value to convert.
   * @param ancestors - Active objects used to detect circular references.
   * @param depth - Current traversal depth.
   * @returns The converted value or an appropriate placeholder.
   */
  private static serializeUnsafe(value: unknown, ancestors: Set<object>, depth: number): unknown {
    if (value === null) {
      return null;
    }
    if (typeof value === "object") {
      return SafeValueSerializer.serializeObject(value, ancestors, depth);
    }
    switch (typeof value) {
      case "string":
      case "number":
      case "boolean":
        return value;
      case "bigint":
        return value.toString();
      case "undefined":
        return UNDEFINED_PLACEHOLDER;
      case "function":
        return FUNCTION_PLACEHOLDER;
      default:
        return SYMBOL_PLACEHOLDER;
    }
  }

  /** Serializes an object while enforcing cycle and depth limits.
   * @param value - Object to serialize.
   * @param ancestors - Active traversal objects; this method restores its own addition.
   * @param depth - Current depth checked against the maximum.
   * @returns Serialized object contents or a cycle/depth placeholder.
   */
  private static serializeObject(value: object, ancestors: Set<object>, depth: number): unknown {
    if (ancestors.has(value)) {
      return CIRCULAR_PLACEHOLDER;
    }
    if (depth >= MAX_VALUE_DEPTH) {
      return MAX_DEPTH_PLACEHOLDER;
    }
    ancestors.add(value);
    try {
      return SafeValueSerializer.serializeContents(value, ancestors, depth + 1);
    } finally {
      ancestors.delete(value);
    }
  }

  /** Selects a representation for dates, errors, collections, arrays, and ordinary objects.
   * @param value - Object whose contents are converted.
   * @param ancestors - Active traversal objects for cycle detection.
   * @param depth - Current depth passed to nested values.
   * @returns A JSON-compatible representation of the object.
   */
  private static serializeContents(value: object, ancestors: Set<object>, depth: number): unknown {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? INVALID_DATE_PLACEHOLDER : value.toISOString();
    }
    if (value instanceof Error) {
      return ErrorSerializer.serializeWithin(value, ancestors, depth);
    }
    if (value instanceof Map) {
      return SafeValueSerializer.serializeItems(value.entries(), ancestors, depth);
    }
    if (value instanceof Set) {
      return SafeValueSerializer.serializeItems(value.values(), ancestors, depth);
    }
    if (Array.isArray(value) || SafeValueSerializer.isTypedArray(value)) {
      return SafeValueSerializer.serializeItems(Array.from(value), ancestors, depth);
    }
    if ("toJSON" in value && typeof value.toJSON === "function") {
      const json: unknown = value.toJSON();
      return SafeValueSerializer.serializeWithin(json, ancestors, depth);
    }
    return SafeValueSerializer.serializeProperties(value, Object.keys(value), ancestors, depth);
  }

  /** Serializes each item in an iterable into an array.
   * @param items - Values yielded in output order.
   * @param ancestors - Active traversal objects for cycle detection.
   * @param depth - Current depth passed to each item.
   * @returns An array of serialized values.
   */
  private static serializeItems(
    items: Iterable<unknown>,
    ancestors: Set<object>,
    depth: number,
  ): unknown[] {
    return Array.from(items, (item) => SafeValueSerializer.serializeWithin(item, ancestors, depth));
  }

  /** Distinguishes typed arrays from `DataView` among array-buffer views.
   * @param value - Object to classify.
   * @returns `true` for a typed array with numeric or bigint elements.
   */
  private static isTypedArray(value: object): value is ArrayLike<number | bigint> {
    return ArrayBuffer.isView(value) && !(value instanceof DataView);
  }
}
