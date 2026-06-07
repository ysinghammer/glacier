import { Schema } from '../Schema';
import { JsonPrimitive } from '../../../shared/types/JsonPrimitive';
import { ValidationError } from '../../errors/ValidationError';

/**
 * EnumSchema
 *
 * Represents the JSON Schema `enum` keyword which constrains a value to a fixed set of primitives.
 * JSON Schema reference: https://json-schema.org/understanding-json-schema/reference/generic.html#enumerated-values
 */
export class EnumSchema<const T extends readonly JsonPrimitive[]> extends Schema<T> {
  private readonly potentialValues: T;

  /**
   * @param potentialValues - A non-empty list of allowed values.
   */
  public constructor(potentialValues: T) {
    super();
    this.potentialValues = potentialValues;
  }

  /**
   * Validates that the value is one of the allowed `enum` members.
   * @param value - The value to validate.
   * @returns The validated enum member.
   * @throws Error if the value is not included in the `potentialValues` set.
   */
  public validate(value: unknown): T {
    this.assertValue(value);
    return value;
  }

  /**
   * Internal assertion to check membership in the `potentialValues` set.
   * @param value - The value to check.
   * @throws Error with a message listing allowed values on failure.
   */
  private assertValue(value: unknown): asserts value is T {
    const matchedValue = this.potentialValues.find((potentialValue) => potentialValue === value);
    if (matchedValue === undefined) {
      throw new ValidationError(
        'ENUM_MISMATCH',
        `Expected value to be one of [${this.potentialValues
          .map((v) => `'${JSON.stringify(v)}'`)
          .join(', ')}], but received '${JSON.stringify(value)}'.`
      );
    }
  }
}
