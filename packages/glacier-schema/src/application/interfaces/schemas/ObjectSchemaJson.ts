import { SchemaJson } from '../SchemaJson';

/**
 * JSON Schema `object` type with explicit properties.
 * References: https://json-schema.org/understanding-json-schema/reference/object.html
 */
export interface ObjectSchemaJson<
  P extends Record<string, SchemaJson> = Record<string, SchemaJson>
> {
  /**
   * Declares the instance must be an object.
   */
  type: 'object';
  /**
   * Map of property names to schemas.
   * JSON Schema `properties`.
   */
  properties: P;
  /**
   * List of required property names.
   * JSON Schema `required`.
   */
  required: (keyof P)[];
}
