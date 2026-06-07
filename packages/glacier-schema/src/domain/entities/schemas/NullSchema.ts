import { Schema } from '../Schema';
import { ValidationError } from '../../errors/ValidationError';

/**
 * NullSchema
 *
 * Represents a JSON Schema `type: "null"` validator.
 * JSON Schema reference: https://json-schema.org/understanding-json-schema/reference/null.html
 *
 * Validates that the provided value is `null`.
 */
export class NullSchema extends Schema<null> {
  /**
   * Validates a value against the null schema.
   *
   * @param value - The value to validate.
   * @returns `null` if the input is null.
   * @throws ValidationError if the value is not strictly `null`.
   */
  public validate(value: unknown): null {
    this.assertValue(value);
    return value;
  }

  /**
   * Internal assertion to ensure the value is `null`.
   *
   * @param value - The value to check.
   * @throws ValidationError if `value !== null`.
   */
  private assertValue(value: unknown): asserts value is null {
    if (value !== null) {
      throw new ValidationError('NULL_TYPE', 'Expected value to be null.');
    }
  }
}
