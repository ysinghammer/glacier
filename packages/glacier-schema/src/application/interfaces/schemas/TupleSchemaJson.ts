import { SchemaJson } from '../SchemaJson';

/**
 * JSON Schema array with positional item schemas (tuple form).
 * References: https://json-schema.org/understanding-json-schema/reference/array.html#items
 */
export interface TupleSchemaJson {
  /**
   * Declares instance must be an array.
   */
  type: 'array';
  /**
   * Positional item schemas; each index has its own schema.
   * JSON Schema `prefixItems`.
   */
  prefixItems: SchemaJson[];
  /**
   * Items after the prefix can be disallowed by setting `items: false`.
   * JSON Schema `items` with boolean form.
   */
  items: false;
}
