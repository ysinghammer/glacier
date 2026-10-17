/** Describes a runtime value the way issue messages and `received` parameters name it. */
export class ReceivedType {
  /** Returns a lowercase label such as `string`, `null`, `array`, `map`, `set`, `nan`, `date` or `object`. */
  public static describe(value: unknown): string {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    if (value instanceof Date) return "date";
    if (value instanceof Map) return "map";
    if (value instanceof Set) return "set";
    if (typeof value === "number") return ReceivedType.#describeNumber(value);
    return typeof value;
  }

  /** Separates numbers that are never valid numeric input from ordinary ones. */
  static #describeNumber(value: number): string {
    if (Number.isNaN(value)) return "nan";
    if (!Number.isFinite(value)) return "infinity";
    return "number";
  }
}
