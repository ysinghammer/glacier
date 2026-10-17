/** Recognises the plain objects that JSON-like input produces. */
export class PlainObject {
  /** Whether `value` is an object created by a literal, `JSON.parse` or `Object.create(null)`. */
  public static is(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object" || value === null) return false;
    const prototype: unknown = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }
}
