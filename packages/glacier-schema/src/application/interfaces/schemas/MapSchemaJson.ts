import { SchemaJson } from '../SchemaJson';
import { StringSchemaJson } from './StringSchemaJson';

/**
 * JSON Schema object schema for a "map"-like structure.
 *
 * References:
 * - Type object: https://json-schema.org/understanding-json-schema/reference/object.html
 * - additionalProperties: https://json-schema.org/understanding-json-schema/reference/object.html#additional-properties
 * - minProperties/maxProperties: https://json-schema.org/understanding-json-schema/reference/object.html#size
 * - propertyNames: https://json-schema.org/understanding-json-schema/reference/object.html#property-names
 * - patternProperties: https://json-schema.org/understanding-json-schema/reference/object.html#pattern-properties
 */
export interface MapSchemaJson {
  /**
   * Declares an object type per JSON Schema.
   * When `type` is 'object', instance values must be non-null objects (not arrays).
   */
  type: 'object';
  /**
   * Controls validation of properties not explicitly defined by `properties`.
   * - `true`: allows arbitrary additional properties without validation.
   * - `SchemaJson`: validates the values of additional properties against the provided schema.
   * This maps to JSON Schema `additionalProperties`.
   */
  additionalProperties: SchemaJson;
  /**
   * Minimum number of properties an object must contain.
   * JSON Schema `minProperties`.
   */
  minProperties?: number;
  /**
   * Maximum number of properties an object may contain.
   * JSON Schema `maxProperties`.
   */
  maxProperties?: number;
  /**
   * Constrains property names using a string schema.
   * Each property name must validate against the provided `StringSchemaJson`.
   * JSON Schema `propertyNames`.
   */
  propertyNames?: StringSchemaJson;
  /**
   * Applies schemas to properties whose names match given regular expression patterns.
   * Keys are regex strings; values are schemas applied to matching properties.
   * JSON Schema `patternProperties`.
   */
  patternProperties?: Record<string, SchemaJson>;
}
