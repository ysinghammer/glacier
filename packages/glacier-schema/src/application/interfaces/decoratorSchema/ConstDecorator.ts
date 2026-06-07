import { JsonPrimitive } from '../../../shared/types/JsonPrimitive';
import { BaseDecorator } from './BaseDecorator';

/**
 * JSON Schema `const` keyword definition.
 * References: https://json-schema.org/understanding-json-schema/reference/constant.html
 */
export interface ConstDecorator extends BaseDecorator {
  /**
   * Requires the instance to be equal to the specified constant value.
   */
  const: JsonPrimitive;
}
