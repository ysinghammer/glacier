import type { IEnumSource } from "./types/IEnumSource.js";

/** Readonly record shape accepted for TypeScript enum and const-object values. */
type IEnumRecord = Readonly<Record<string, string | number>>;

/** Extracts the accepted values from an enum source. */
export class EnumValues {
  /**
   * Extracts distinct scalar values from a list or enum-like record.
   * @param source Readonly array, TypeScript enum or const object.
   * @returns Unique string and number values in source enumeration order.
   */
  public static from(source: IEnumSource): readonly (string | number)[] {
    if (EnumValues.isList(source)) return [...new Set(source)];
    const values = Object.entries(source)
      .filter(([name, value]) => !EnumValues.isReverseMapping(source, name, value))
      .map(([, value]) => value);
    return [...new Set(values)];
  }

  /**
   * Narrows an enum source to its list representation.
   * @param source Enum-like source to inspect.
   * @returns True when source is an array of values.
   */
  private static isList(source: IEnumSource): source is readonly (string | number)[] {
    return Array.isArray(source);
  }

  /**
   * Detects a TypeScript numeric-enum reverse-mapping entry.
   * @param record Enum-like record containing forward and reverse entries.
   * @param name Entry key under inspection.
   * @param value Entry value under inspection.
   * @returns True when the string value maps back to the numeric key.
   */
  private static isReverseMapping(
    record: IEnumRecord,
    name: string,
    value: string | number,
  ): boolean {
    return typeof value === "string" && record[value] === Number(name);
  }
}
