import { BaseDecorator } from './BaseDecorator';

/**
 * JSON Schema `string` type definition.
 * References: https://json-schema.org/understanding-json-schema/reference/string.html
 */
export interface StringDecorator extends BaseDecorator {
  /**
   * Declares the instance must be a string.
   */
  type: 'string';
  /**
   * Minimum length in characters.
   * JSON Schema `minLength`.
   */
  minLength?: number;
  /**
   * Maximum length in characters.
   * JSON Schema `maxLength`.
   */
  maxLength?: number;
  /**
   * Regular expression pattern the string must match.
   * JSON Schema `pattern`.
   */
  pattern?: string;
}
