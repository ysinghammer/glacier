import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { INumberRules } from "./types/INumberRules.js";
import type { ISizeRules } from "./types/ISizeRules.js";
import type { IStringRules } from "./types/IStringRules.js";
import { StringFormats } from "../validation/StringFormats.js";

/** Rejects constraint declarations that could never be satisfied or are malformed, when decorating. */
export class RuleDefinitionCheck {
  /**
   * Validates string-rule ranges and configured pattern and format values.
   * @param label Field label included in definition diagnostics.
   * @param rules String constraints and normalisations to check.
   * @returns No value; validates the declaration before metadata is stored.
   * @throws {SchemaDefinitionError} If string constraints or formats are malformed.
   */
  public static string(label: string, rules: IStringRules): void {
    for (const name of ["min", "max", "length"] as const) {
      const value = rules[name];
      if (value !== undefined && !(Number.isSafeInteger(value) && value >= 0)) {
        throw new SchemaDefinitionError(`${label}: ${name} must be a non-negative integer`);
      }
    }
    if (rules.length !== undefined && (rules.min !== undefined || rules.max !== undefined)) {
      throw new SchemaDefinitionError(`${label}: length cannot be combined with min or max`);
    }
    if (rules.min !== undefined && rules.max !== undefined && rules.min > rules.max) {
      throw new SchemaDefinitionError(`${label}: min must not exceed max`);
    }
    if (rules.pattern !== undefined && !(rules.pattern instanceof RegExp)) {
      throw new SchemaDefinitionError(`${label}: pattern must be a RegExp`);
    }
    if (rules.format !== undefined && !StringFormats.isKnown(rules.format)) {
      throw new SchemaDefinitionError(`${label}: unknown format ${String(rules.format)}`);
    }
  }

  /**
   * Validates numeric bounds and the positive divisor constraint.
   * @param label Field label included in definition diagnostics.
   * @param rules Numeric constraints to check.
   * @returns No value; validates the declaration before metadata is stored.
   * @throws {SchemaDefinitionError} If numeric bounds conflict or are non-finite.
   */
  public static number(label: string, rules: INumberRules): void {
    for (const name of ["min", "max", "exclusiveMin", "exclusiveMax", "multipleOf"] as const) {
      const value = rules[name];
      if (value !== undefined && !Number.isFinite(value)) {
        throw new SchemaDefinitionError(`${label}: ${name} must be a finite number`);
      }
    }
    if (rules.multipleOf !== undefined && rules.multipleOf <= 0) {
      throw new SchemaDefinitionError(`${label}: multipleOf must be positive`);
    }
    if (rules.min !== undefined && rules.max !== undefined && rules.min > rules.max) {
      throw new SchemaDefinitionError(`${label}: min must not exceed max`);
    }
    if (
      rules.exclusiveMin !== undefined &&
      rules.exclusiveMax !== undefined &&
      rules.exclusiveMin >= rules.exclusiveMax
    ) {
      throw new SchemaDefinitionError(`${label}: exclusiveMin must be below exclusiveMax`);
    }
  }

  /**
   * Validates non-negative integer collection-size bounds.
   * @param label Field label included in definition diagnostics.
   * @param rules Minimum and maximum entry counts.
   * @returns No value; validates the declaration before metadata is stored.
   * @throws {SchemaDefinitionError} If a bound is invalid or minimum exceeds maximum.
   */
  public static size(label: string, rules: ISizeRules): void {
    for (const name of ["min", "max"] as const) {
      const value = rules[name];
      if (value !== undefined && !(Number.isSafeInteger(value) && value >= 0)) {
        throw new SchemaDefinitionError(`${label}: ${name} must be a non-negative integer`);
      }
    }
    if (rules.min !== undefined && rules.max !== undefined && rules.min > rules.max) {
      throw new SchemaDefinitionError(`${label}: min must not exceed max`);
    }
  }
}
