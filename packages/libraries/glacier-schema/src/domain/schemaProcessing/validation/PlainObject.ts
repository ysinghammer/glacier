/** Recognises the plain objects that JSON-like input produces. */
export class PlainObject {
  /**
   * Checks whether a value has the plain-object prototype used by literals, JSON and null-prototype records.
   * @param value Runtime value to inspect without reading its properties.
   * @returns True for a non-null object with `Object.prototype` or null as its prototype.
   */
  public static is(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object" || value === null) return false;
    const prototype: unknown = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }
}
