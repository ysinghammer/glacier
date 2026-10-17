import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { INumberRules } from "./INumberRules.js";
import type { IStringRules } from "./IStringRules.js";
import { StringFormats } from "../validation/StringFormats.js";

/** Rejects constraint declarations that could never be satisfied or are malformed, when decorating. */
export class RuleDefinitionCheck {
  /**
   * Throws `SchemaDefinitionError` naming `label` when `rules` contain a negative or fractional length,
   * `min` above `max`, `length` combined with `min` or `max`, an unknown `format` or a non-RegExp `pattern`.
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
   * Throws `SchemaDefinitionError` naming `label` when a bound is not a finite number, the bounds leave
   * no accepted value, or `multipleOf` is not a positive finite number.
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
}
