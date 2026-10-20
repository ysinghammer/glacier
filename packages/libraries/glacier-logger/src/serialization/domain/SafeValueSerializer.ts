import { ErrorSerializer } from "./ErrorSerializer.js";

const MAX_VALUE_DEPTH = 32;
const CIRCULAR_PLACEHOLDER = "[Circular]";
const MAX_DEPTH_PLACEHOLDER = "[Max depth]";
const UNSERIALIZABLE_PLACEHOLDER = "[Unserializable]";
const UNDEFINED_PLACEHOLDER = "[undefined]";
const FUNCTION_PLACEHOLDER = "[Function]";
const SYMBOL_PLACEHOLDER = "[Symbol]";
const INVALID_DATE_PLACEHOLDER = "[Invalid Date]";

/**
 * Turns any value into a plain structure that `JSON.stringify` accepts. It never throws:
 * anything it cannot read becomes a stable placeholder string, and the caller's data is never
 * mutated.
 */
export class SafeValueSerializer {
  /** Serialises each own enumerable property of a record, keeping the record shape. */
  static serializeRecord(record: Readonly<Record<string, unknown>>): Record<string, unknown> {
    return SafeValueSerializer.serializeProperties(
      record,
      Object.keys(record),
      new Set([record]),
      1,
    );
  }

  /**
   * Serialises a value reached through `ancestors`, the objects currently being serialised.
   * Used by the error serialiser so cycles spanning both are detected.
   */
  static serializeWithin(value: unknown, ancestors: Set<object>, depth: number): unknown {
    try {
      return SafeValueSerializer.#serializeUnsafe(value, ancestors, depth);
    } catch {
      return UNSERIALIZABLE_PLACEHOLDER;
    }
  }

  /** Serialises the named properties of `target`. A throwing getter yields a placeholder. */
  static serializeProperties(
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

  static #serializeUnsafe(value: unknown, ancestors: Set<object>, depth: number): unknown {
    if (value === null) {
      return null;
    }
    if (typeof value === "object") {
      return SafeValueSerializer.#serializeObject(value, ancestors, depth);
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

  static #serializeObject(value: object, ancestors: Set<object>, depth: number): unknown {
    if (ancestors.has(value)) {
      return CIRCULAR_PLACEHOLDER;
    }
    if (depth >= MAX_VALUE_DEPTH) {
      return MAX_DEPTH_PLACEHOLDER;
    }
    ancestors.add(value);
    try {
      return SafeValueSerializer.#serializeContents(value, ancestors, depth + 1);
    } finally {
      ancestors.delete(value);
    }
  }

  static #serializeContents(value: object, ancestors: Set<object>, depth: number): unknown {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? INVALID_DATE_PLACEHOLDER : value.toISOString();
    }
    if (value instanceof Error) {
      return ErrorSerializer.serializeWithin(value, ancestors, depth);
    }
    if (value instanceof Map) {
      return SafeValueSerializer.#serializeItems(value.entries(), ancestors, depth);
    }
    if (value instanceof Set) {
      return SafeValueSerializer.#serializeItems(value.values(), ancestors, depth);
    }
    if (Array.isArray(value) || SafeValueSerializer.#isTypedArray(value)) {
      return SafeValueSerializer.#serializeItems(Array.from(value), ancestors, depth);
    }
    if ("toJSON" in value && typeof value.toJSON === "function") {
      const json: unknown = value.toJSON();
      return SafeValueSerializer.serializeWithin(json, ancestors, depth);
    }
    return SafeValueSerializer.serializeProperties(value, Object.keys(value), ancestors, depth);
  }

  static #serializeItems(
    items: Iterable<unknown>,
    ancestors: Set<object>,
    depth: number,
  ): unknown[] {
    return Array.from(items, (item) => SafeValueSerializer.serializeWithin(item, ancestors, depth));
  }

  static #isTypedArray(value: object): value is ArrayLike<number | bigint> {
    return ArrayBuffer.isView(value) && !(value instanceof DataView);
  }
}
