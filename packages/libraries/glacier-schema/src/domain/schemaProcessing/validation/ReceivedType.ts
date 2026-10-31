/** Describes a runtime value the way issue messages and `received` parameters name it. */
export class ReceivedType {
  /**
   * Describes a runtime value with the labels used by validation issues.
   * @param value Value whose runtime category is described.
   * @returns Lowercase type label, distinguishing special numeric and collection values.
   */
  public static describe(value: unknown): string {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    if (value instanceof Date) return "date";
    if (value instanceof Map) return "map";
    if (value instanceof Set) return "set";
    if (typeof value === "number") return ReceivedType.describeNumber(value);
    return typeof value;
  }

  /**
   * Distinguishes non-finite numbers from ordinary numeric values.
   * @param value Number to classify.
   * @returns `nan`, `infinity` or `number` according to the value.
   */
  private static describeNumber(value: number): string {
    if (Number.isNaN(value)) return "nan";
    if (!Number.isFinite(value)) return "infinity";
    return "number";
  }
}
