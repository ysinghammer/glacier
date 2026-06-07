import { ArrayDecorator } from './ArrayDecorator';

/**
 * JSON Schema `array` with uniqueness constraint (set-like).
 * References: https://json-schema.org/understanding-json-schema/reference/array.html#uniqueness
 */
export interface SetDecorator extends ArrayDecorator {
  /**
   * Enforces unique items within the array.
   * JSON Schema `uniqueItems`.
   */
  uniqueItems: true;
}
