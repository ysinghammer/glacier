import { Schema } from '../Schema';
import { JsonPrimitive } from '../../../shared/types/JsonPrimitive';
import { ValidationError } from '../../errors/ValidationError';

/**
 * ConstSchema
 *
 * Represents the JSON Schema `const` keyword which requires the instance value to be equal to a single value.
 * JSON Schema reference: https://json-schema.org/understanding-json-schema/reference/constant.html
 */
export class ConstSchema<const V extends JsonPrimitive> extends Schema<V> {
  private readonly expectedValue: V;

  /**
   * @param expectedValue - The exact value that instances must equal.
   */
  public constructor(expectedValue: V) {
    super();
    this.expectedValue = expectedValue;
  }

  /**
   * Validates that the value equals the configured constant.
   * @param value - The value to validate.
   * @returns The validated constant value.
   * @throws Error if the value does not equal the constant.
   */
  public validate(value: unknown): V {
    this.assertValue(value);
    return value;
  }

  /**
   * Internal assertion for equality against the constant value.
   * @param value - The value to check.
   * @throws Error with a message describing the mismatch.
   */
  private assertValue(value: unknown): asserts value is V {
    if (value !== this.expectedValue) {
      throw new ValidationError(
        'CONST_MISMATCH',
        `Expected value to be constant '${JSON.stringify(this.expectedValue)}', but received '${JSON.stringify(value)}'.`
      );
    }
  }
}
