import type { IEnumSource } from "./IEnumSource.js";

type IEnumRecord = Readonly<Record<string, string | number>>;

/** Extracts the accepted values from an enum source. */
export class EnumValues {
  /**
   * Returns the distinct values of an array, or of an enum/const object. Numeric-enum reverse mappings
   * (`E[0] === "A"` next to `E.A === 0`) are not values and are skipped.
   */
  public static from(source: IEnumSource): readonly (string | number)[] {
    if (EnumValues.#isList(source)) return [...new Set(source)];
    const values = Object.entries(source)
      .filter(([name, value]) => !EnumValues.#isReverseMapping(source, name, value))
      .map(([, value]) => value);
    return [...new Set(values)];
  }

  /** Distinguishes the array form from the record form. */
  static #isList(source: IEnumSource): source is readonly (string | number)[] {
    return Array.isArray(source);
  }

  /** A reverse-mapping entry has a numeric name and a string value that maps back to that number. */
  static #isReverseMapping(record: IEnumRecord, name: string, value: string | number): boolean {
    return typeof value === "string" && record[value] === Number(name);
  }
}
