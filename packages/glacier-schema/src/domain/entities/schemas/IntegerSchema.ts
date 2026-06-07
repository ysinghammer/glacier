import { NumberSchema } from './NumberSchema';
import { ValidationError } from '../../errors/ValidationError';

/**
 * IntegerSchema
 *
 * Represents a JSON Schema `type: "integer"` validator.
 * Shares numeric constraints with `NumberSchema` but also enforces that the value is an integer.
 * JSON Schema reference: https://json-schema.org/understanding-json-schema/reference/numeric.html#integer
 */
export class IntegerSchema extends NumberSchema {
  /**
   * Validates that the value satisfies numeric constraints and is an integer.
   * @param value - The value to validate.
   * @returns The validated integer value.
   * @throws ValidationError if the value is not an integer or violates numeric constraints.
   */
  public validate(value: unknown): number {
    const validatedValue = super.validate(value);
    this.assertInteger(validatedValue);
    return validatedValue;
  }

  /**
   * Internal assertion to ensure the value is an integer.
   * @param value - The number to check.
   * @throws ValidationError if `Number.isInteger(value)` is false.
   */
  private assertInteger(value: number): asserts value is number {
    if (!Number.isInteger(value)) {
      throw new ValidationError('INTEGER_TYPE', 'Expected value to be an integer.');
    }
  }
}
