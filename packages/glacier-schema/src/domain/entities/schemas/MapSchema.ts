import { Schema } from '../Schema';
import { ValidationError } from '../../errors/ValidationError';
import { StringSchema } from './StringSchema';

/**
 * MapSchema
 *
 * Represents a JSON Schema object validator for maps of properties where all additional properties share
 * the same schema. It models several object-related keywords:
 * - `additionalProperties`: https://json-schema.org/understanding-json-schema/reference/object.html#additional-properties
 * - `propertyNames`: https://json-schema.org/understanding-json-schema/reference/object.html#property-names
 * - `patternProperties`: https://json-schema.org/understanding-json-schema/reference/object.html#pattern-properties
 * - `minProperties` / `maxProperties`: https://json-schema.org/understanding-json-schema/reference/object.html#size
 */
export class MapSchema<const O, const A extends Schema<O>> extends Schema<Record<string, O>> {
  private readonly additionalProperties: A;
  private minProperties?: number;
  private maxProperties?: number;
  private propertyNames?: StringSchema;
  private patternProperties?: Record<string, Schema>;

  /**
   * @param additionalProperties - Schema to validate values of all additional properties.
   */
  public constructor(additionalProperties: A) {
    super();
    this.additionalProperties = additionalProperties;
  }

  /**
   * Sets the minimum number of properties (`minProperties`).
   * @param min - Minimum property count.
   * @returns this for chaining.
   */
  public setMinProperties(min: number): this {
    this.minProperties = min;
    return this;
  }

  /**
   * Sets the maximum number of properties (`maxProperties`).
   * @param max - Maximum property count.
   * @returns this for chaining.
   */
  public setMaxProperties(max: number): this {
    this.maxProperties = max;
    return this;
  }

  /**
   * Sets the schema to validate property names (`propertyNames`).
   * @param schema - A `StringSchema` used to validate property names.
   * @returns this for chaining.
   */
  public setPropertyNames(schema: StringSchema): this {
    this.propertyNames = schema;
    return this;
  }

  /**
   * Sets regex patterns mapped to schemas for validating properties that match (`patternProperties`).
   * @param patterns - A map of regex pattern strings to schemas.
   * @returns this for chaining.
   */
  public setPatternProperties(patterns: Record<string, Schema>): this {
    this.patternProperties = patterns;
    return this;
  }

  /**
   * Validates object type and applies property-based constraints and validations.
   * Checks `minProperties`, `maxProperties`, `propertyNames`, `patternProperties`, and `additionalProperties`.
   * @param value - The value to validate.
   * @returns The validated object (shape determined by `additionalProperties`).
   * @throws ValidationError if type or any constraint fails.
   */
  public validate(value: unknown): Record<string, O> {
    this.assertType(value);
    this.assertMinProperties(value);
    this.assertMaxProperties(value);
    this.assertPropertyNames(value);
    this.assertPatternProperties(value);
    this.assertAdditionalProperties(value);
    return value;
  }

  /**
   * Validates all additional properties against the configured schema (`additionalProperties`).
   * @param value - The object to validate.
   */
  private assertAdditionalProperties(
    value: Record<string, unknown>
  ): asserts value is Record<string, O> {
    for (const key in value) {
      try {
        this.additionalProperties.validate(value[key]);
      } catch (err) {
        /* istanbul ignore else */
        if (err instanceof ValidationError) {
          throw err.withPrefix(key);
        }
        /* istanbul ignore next */
        throw err;
      }
    }
  }

  /**
   * Validates pattern-based properties (`patternProperties`).
   * @param value - The object to validate.
   */
  private assertPatternProperties(value: Record<string, unknown>): void {
    if (this.patternProperties === undefined) return;
    for (const key in value) {
      for (const [pattern, schema] of Object.entries(this.patternProperties)) {
        const regex = new RegExp(pattern);
        if (regex.test(key)) {
          try {
            schema.validate(value[key]);
          } catch (err) {
            /* istanbul ignore else */
            if (err instanceof ValidationError) {
              throw err.withPrefix(key);
            }
            /* istanbul ignore next */
            throw err;
          }
        }
      }
    }
  }

  /**
   * Validates property names against `propertyNames` schema if configured.
   * @param value - The object to validate.
   */
  private assertPropertyNames(value: Record<string, unknown>): void {
    if (this.propertyNames === undefined) return;
    for (const key in value) {
      this.propertyNames.validate(key);
    }
  }

  /**
   * Asserts `maxProperties` if configured.
   * @param value - The object to check.
   * @throws ValidationError if property count exceeds limit.
   */
  private assertMaxProperties(value: object): void {
    if (this.maxProperties === undefined) return;
    const propertyCount = Object.keys(value).length;
    if (propertyCount > this.maxProperties) {
      throw new ValidationError(
        'OBJECT_MAX_PROPERTIES',
        `Object has more properties (${propertyCount.toString()}) than the maximum allowed (${this.maxProperties.toString()}).`
      );
    }
  }

  /**
   * Asserts `minProperties` if configured.
   * @param value - The object to check.
   * @throws ValidationError if property count is below limit.
   */
  private assertMinProperties(value: object): void {
    if (this.minProperties === undefined) return;
    const propertyCount = Object.keys(value).length;
    if (propertyCount < this.minProperties) {
      throw new ValidationError(
        'OBJECT_MIN_PROPERTIES',
        `Object has fewer properties (${propertyCount.toString()}) than the minimum required (${this.minProperties.toString()}).`
      );
    }
  }

  /**
   * Asserts the value is a non-null object and not an array (`type: object`).
   * @param value - The value to check.
   * @throws ValidationError if not a plain object.
   */
  private assertType(value: unknown): asserts value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ValidationError('OBJECT_TYPE', 'Expected value to be an object.');
    }
  }
}
