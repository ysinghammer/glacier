import type { IJsonObject, IJsonValue } from "@glacier/schema";

/**
 * Detaches documentation JSON without invoking accessors or consumer serialization callbacks.
 */
export class OpenApiJson {
  /**
   * Copies finite acyclic JSON-compatible data without invoking getters or toJSON methods.
   * @param value Untrusted documentation value to copy.
   * @param active Current recursion path used to reject cyclic references; defaults to a new set.
   * @returns A detached JSON-compatible value.
   * @throws {TypeError} When input is undefined, a function, a symbol, or a bigint.
   */
  public static copy(value: unknown, active: Set<object> = new Set()): IJsonValue {
    const primitive = OpenApiJson.primitive(value);
    if (primitive !== undefined) return primitive;
    if (value === null || typeof value !== "object")
      throw new TypeError("Documentation must be safe acyclic JSON");
    return OpenApiJson.copyObject(value, active);
  }

  /**
   * Recognizes JSON primitives and finite numbers without allocating containers.
   * @param value Candidate primitive value.
   * @returns The JSON primitive, or undefined when a container must be copied.
   * @throws {TypeError} When a numeric value is not finite.
   */
  private static primitive(value: unknown): IJsonValue | undefined {
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "number") throw new TypeError("Documentation must be safe acyclic JSON");
    return undefined;
  }

  /**
   * Validates a container prototype and copies its enumerable own data fields.
   * @param value Array or plain object to detach.
   * @param active Current recursion path used for cycle detection.
   * @returns A detached JSON object or array.
   * @throws {TypeError} When the value is cyclic or has a non-plain object prototype.
   */
  private static copyObject(value: object, active: Set<object>): IJsonValue {
    if (active.has(value)) throw new TypeError("Documentation must be safe acyclic JSON");
    const prototype: unknown = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null)
      throw new TypeError("Documentation must use plain JSON objects");
    active.add(value);
    try {
      const entries = OpenApiJson.entries(value, active);
      if (Array.isArray(value)) return OpenApiJson.array(value, entries);
      return Object.fromEntries(entries);
    } finally {
      active.delete(value);
    }
  }

  /**
   * Reads enumerable own data descriptors and recursively copies their values.
   * @param value Container whose enumerable properties are copied.
   * @param active Current recursion path used for cycle detection.
   * @returns Key/value entries detached from the source container.
   * @throws {TypeError} When an enumerable property is an accessor rather than data.
   */
  private static entries(value: object, active: Set<object>): [string, IJsonValue][] {
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const entries: [string, IJsonValue][] = [];
    for (const key of Object.keys(value)) {
      const descriptor = descriptors[key];
      if (descriptor === undefined || !("value" in descriptor))
        throw new TypeError("Documentation accessors are unsupported");
      entries.push([key, OpenApiJson.copy(descriptor.value, active)]);
    }
    return entries;
  }

  /**
   * Confirms copied array entries are dense and ordered before returning their values.
   * @param value Source array used to verify the expected length.
   * @param entries Enumerable copied entries for that array.
   * @returns Dense ordered array values.
   * @throws {TypeError} When the source array is sparse or has extra enumerable keys.
   */
  private static array(value: readonly unknown[], entries: [string, IJsonValue][]): IJsonValue[] {
    const isDense =
      entries.length === value.length && entries.every(([key], index) => key === String(index));
    if (!isDense) throw new TypeError("Documentation arrays must be dense JSON arrays");
    return entries.map(([, item]) => item);
  }

  /**
   * Copies a value and narrows it to a detached OpenAPI object record.
   * @param value Untrusted documentation value to copy as an object.
   * @returns A detached object with JSON-compatible entries.
   * @throws {TypeError} When the copied value is not a non-array object.
   */
  public static object(value: unknown): IJsonObject {
    const copy = OpenApiJson.copy(value);
    if (typeof copy !== "object" || copy === null || Array.isArray(copy))
      throw new TypeError("Expected documentation object");
    return Object.fromEntries(Object.entries(copy));
  }

  /**
   * Escapes a schema component name for use as one JSON Pointer token.
   * @param name Component key to encode.
   * @returns URI-encoded JSON Pointer token text.
   */
  public static pointer(name: string): string {
    return encodeURIComponent(name.replaceAll("~", "~0").replaceAll("/", "~1"));
  }
}
