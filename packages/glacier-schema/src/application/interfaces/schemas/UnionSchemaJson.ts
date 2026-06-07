import { ObjectSchemaJson } from './ObjectSchemaJson';

/**
 * JSON Schema `oneOf` union of object schemas.
 * References: https://json-schema.org/understanding-json-schema/reference/combining.html#oneof
 */
export interface UnionSchemaJson {
  /**
   * A list of object schemas; the instance must validate against exactly one.
   * JSON Schema `oneOf`.
   */
  oneOf: ObjectSchemaJson[];
}
