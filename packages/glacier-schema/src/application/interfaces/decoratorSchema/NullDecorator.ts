import { BaseDecorator } from './BaseDecorator';

/**
 * JSON Schema `null` type definition.
 * References: https://json-schema.org/understanding-json-schema/reference/null.html
 */
export interface NullDecorator extends BaseDecorator {
  /**
   * Declares the instance must be `null`.
   */
  type: 'null';
}
