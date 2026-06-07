import { SchemaJson } from '../SchemaJson';

/**
 * JSON Schema `array` type definition.
 * References: https://json-schema.org/understanding-json-schema/reference/array.html
 */
export interface ArraySchemaJson {
  /**
   * Declares the instance must be an array.
   */
  type: 'array';
  /**
   * Schema applied to all items in the array (single schema form).
   * JSON Schema `items` (single schema).
   */
  items: SchemaJson;
  /**
   * Minimum number of items the array must contain.
   * JSON Schema `minItems`.
   */
  minItems?: number;
  /**
   * Maximum number of items the array may contain.
   * JSON Schema `maxItems`.
   */
  maxItems?: number;
}
