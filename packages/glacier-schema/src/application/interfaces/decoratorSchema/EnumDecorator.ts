import { JsonPrimitive } from '../../../shared/types/JsonPrimitive';
import { BaseDecorator } from './BaseDecorator';

/**
 * JSON Schema `enum` keyword definition.
 * References: https://json-schema.org/understanding-json-schema/reference/generic.html#enumerated-values
 */
export interface EnumDecorator extends BaseDecorator {
  /**
   * A non-empty array of allowed values.
   */
  enum: JsonPrimitive[];
}
