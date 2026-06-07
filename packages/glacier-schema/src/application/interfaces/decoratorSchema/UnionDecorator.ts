import { BaseDecorator } from './BaseDecorator';
import { ObjectDecorator } from './ObjectDecorator';

/**
 * JSON Schema `oneOf` union of object schemas.
 * References: https://json-schema.org/understanding-json-schema/reference/combining.html#oneof
 */
export interface UnionDecorator extends BaseDecorator {
  /**
   * A list of object schemas; the instance must validate against exactly one.
   * JSON Schema `oneOf`.
   */
  oneOf: ObjectDecorator[];
}
