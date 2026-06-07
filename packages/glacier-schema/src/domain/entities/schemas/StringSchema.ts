import { Schema } from '../Schema';
import { ValidationError } from '../../errors/ValidationError';

/**
 * StringSchema
 *
 * Represents a JSON Schema `type: "string"` validator and supports common string keywords:
 * - `minLength`, `maxLength`: https://json-schema.org/understanding-json-schema/reference/string.html#length
 * - `pattern`: https://json-schema.org/understanding-json-schema/reference/string.html#regular-expressions
 */
export class StringSchema extends Schema<string> {
  private minLength?: number;
  private maxLength?: number;
  private pattern?: RegExp;

  /**
   * Sets the minimum allowed string length (JSON Schema `minLength`).
   * @param minLength - Minimum number of characters.
   * @returns this for chaining.
   */
  public setMinLength(minLength: number): this {
    this.minLength = minLength;
    return this;
  }

  /**
   * Sets the maximum allowed string length (JSON Schema `maxLength`).
   * @param maxLength - Maximum number of characters.
   * @returns this for chaining.
   */
  public setMaxLength(maxLength: number): this {
    this.maxLength = maxLength;
    return this;
  }

  /**
   * Sets the required pattern (regular expression) that the string must match (JSON Schema `pattern`).
   * @param pattern - A regular expression.
   * @returns this for chaining.
   */
  public setPattern(pattern: RegExp): this {
    this.pattern = pattern;
    return this;
  }

  /**
   * Validates that the value is a string and satisfies `minLength`, `maxLength`, and `pattern` if configured.
   * @param value - The value to validate.
   * @returns The validated string.
   * @throws ValidationError if type or any constraint fails.
   */
  public validate(value: unknown): string {
    this.assertType(value);
    this.assertLength(value);
    this.assertPattern(value);
    return value;
  }

  /**
   * Asserts the `pattern` constraint if configured.
   * @param value - The string to check.
   * @throws ValidationError if the pattern does not match.
   */
  private assertPattern(value: string): void {
    if (this.pattern && !this.pattern.test(value)) {
      throw new ValidationError(
        'STRING_PATTERN',
        `String does not match the required pattern: ${this.pattern.source}`
      );
    }
  }

  /**
   * Asserts the value is of type string.
   * @param value - The value to check.
   * @throws ValidationError if value is not a string.
   */
  private assertType(value: unknown): asserts value is string {
    if (typeof value !== 'string') {
      throw new ValidationError('STRING_TYPE', 'Expected value to be a string.');
    }
  }

  /**
   * Asserts the `minLength` and `maxLength` constraints if configured.
   * @param value - The string to check.
   * @throws ValidationError if any length constraint fails.
   */
  private assertLength(value: string): void {
    if (typeof this.minLength === 'number' && value.length < this.minLength) {
      throw new ValidationError(
        'STRING_MIN_LENGTH',
        `Expected string length to be at least ${this.minLength.toString()}.`
      );
    }
    if (typeof this.maxLength === 'number' && value.length > this.maxLength) {
      throw new ValidationError(
        'STRING_MAX_LENGTH',
        `Expected string length to be at most ${this.maxLength.toString()}.`
      );
    }
  }
}
