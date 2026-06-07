import { Schema } from '../Schema';
import { ValidationError } from '../../errors/ValidationError';

/**
 * BooleanSchema
 *
 * Represents a JSON Schema `type: "boolean"` validator.
 * JSON Schema reference: https://json-schema.org/understanding-json-schema/reference/type.html#boolean
 *
 * Validates that the provided value is a JavaScript boolean.
 */
export class BooleanSchema extends Schema<boolean> {
  /**
   * Validates whether a value is a boolean.
   *
   * @param value - The value to validate.
   * @returns The validated boolean value.
   * @throws ValidationError if the value is not of type boolean.
   */
  public validate(value: unknown): boolean {
    this.assertValue(value);
    return value;
  }

  /**
   * Internal assertion to ensure the value is a boolean.
   *
   * @param value - The value to check.
   * @throws ValidationError if `typeof value !== 'boolean'`.
   */
  private assertValue(value: unknown): asserts value is boolean {
    if (typeof value !== 'boolean') {
      throw new ValidationError('BOOLEAN_TYPE', 'Expected value to be a boolean.');
    }
  }
}
