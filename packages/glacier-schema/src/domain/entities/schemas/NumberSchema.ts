import { Schema } from '../Schema';
import { ValidationError } from '../../errors/ValidationError';

/**
 * NumberSchema
 *
 * Represents a JSON Schema numeric validator for `type: "number"` and supports:
 * - `multipleOf`: https://json-schema.org/understanding-json-schema/reference/numeric.html#multiples
 * - `maximum`/`exclusiveMaximum`: https://json-schema.org/understanding-json-schema/reference/numeric.html#range
 * - `minimum`/`exclusiveMinimum`: https://json-schema.org/understanding-json-schema/reference/numeric.html#range
 */
export class NumberSchema extends Schema<number> {
  private multipleOf?: number;
  private maximum?: number;
  private exclusiveMaximum?: boolean;
  private minimum?: number;
  private exclusiveMinimum?: boolean;

  /**
   * Sets the `multipleOf` constraint (value must be a multiple of the given number).
   * @param multipleOf - A positive number.
   * @returns this for chaining.
   */
  public setMultipleOf(multipleOf: number): this {
    this.multipleOf = multipleOf;
    return this;
  }

  /**
   * Sets the maximum boundary.
   * @param maximum - The maximum permitted value.
   * @param exclusive - If true, enforces `value < maximum` (exclusiveMaximum). Otherwise, `value <= maximum`.
   * @returns this for chaining.
   */
  public setMaximum(maximum: number, exclusive: boolean = false): this {
    this.maximum = maximum;
    this.exclusiveMaximum = exclusive;
    return this;
  }

  /**
   * Sets the minimum boundary.
   * @param minimum - The minimum permitted value.
   * @param exclusive - If true, enforces `value > minimum` (exclusiveMinimum). Otherwise, `value >= minimum`.
   * @returns this for chaining.
   */
  public setMinimum(minimum: number, exclusive: boolean = false): this {
    this.minimum = minimum;
    this.exclusiveMinimum = exclusive;
    return this;
  }

  /**
   * Validates the numeric value and all configured constraints.
   * @param value - The value to validate.
   * @returns The validated number.
   * @throws ValidationError if type or any constraint fails.
   */
  public validate(value: unknown): number {
    this.assertType(value);
    this.assertMultipleOf(value);
    this.assertMaximum(value);
    this.assertMinimum(value);
    return value;
  }

  /**
   * Asserts that value is a number (`type: number`).
   * @param value - The value to check.
   * @throws ValidationError if value is not a number.
   */
  private assertType(value: unknown): asserts value is number {
    if (typeof value !== 'number') {
      throw new ValidationError('NUMBER_TYPE', 'Expected value to be a number.');
    }
  }

  /**
   * Asserts the `multipleOf` constraint if configured.
   * @param value - The number to check.
   * @throws ValidationError if `value % multipleOf !== 0`.
   */
  private assertMultipleOf(value: number): void {
    if (this.multipleOf && value % this.multipleOf !== 0) {
      throw new ValidationError(
        'NUMBER_MULTIPLE_OF',
        `Expected value to be a multiple of ${this.multipleOf.toString()}.`
      );
    }
  }

  /**
   * Asserts the `maximum` or `exclusiveMaximum` constraint if configured.
   * @param value - The number to check.
   * @throws ValidationError if the constraint fails.
   */
  private assertMaximum(value: number): void {
    if (typeof this.maximum === 'number') {
      if (this.exclusiveMaximum) {
        if (value >= this.maximum) {
          throw new ValidationError(
            'NUMBER_EXCLUSIVE_MAXIMUM',
            `Expected value to be less than ${this.maximum.toString()}.`
          );
        }
      } else {
        if (value > this.maximum) {
          throw new ValidationError(
            'NUMBER_MAXIMUM',
            `Expected value to be less than or equal to ${this.maximum.toString()}.`
          );
        }
      }
    }
  }

  /**
   * Asserts the `minimum` or `exclusiveMinimum` constraint if configured.
   * @param value - The number to check.
   * @throws ValidationError if the constraint fails.
   */
  private assertMinimum(value: number): void {
    if (typeof this.minimum === 'number') {
      if (this.exclusiveMinimum) {
        if (value <= this.minimum) {
          throw new ValidationError(
            'NUMBER_EXCLUSIVE_MINIMUM',
            `Expected value to be greater than ${this.minimum.toString()}.`
          );
        }
      } else {
        if (value < this.minimum) {
          throw new ValidationError(
            'NUMBER_MINIMUM',
            `Expected value to be greater than or equal to ${this.minimum.toString()}.`
          );
        }
      }
    }
  }
}
