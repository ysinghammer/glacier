import { BaseDecorator } from './BaseDecorator';

/**
 * JSON Schema `boolean` type definition.
 * References: https://json-schema.org/understanding-json-schema/reference/type.html#boolean
 */
export interface BooleanDecorator extends BaseDecorator {
  /**
   * Declares the instance must be a boolean.
   */
  type: 'boolean';
}
