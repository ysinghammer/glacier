import { Schema } from '../Schema';
import { ValidationError } from '../../errors/ValidationError';

/**
 * ArraySchema
 *
 * Represents a JSON Schema `type: "array"` validator.
 * Supports item schema validation and common array keywords:
 * - `minItems`, `maxItems`: https://json-schema.org/understanding-json-schema/reference/array.html#length
 * - `items` (single schema for all items): https://json-schema.org/understanding-json-schema/reference/array.html#items
 */
export class ArraySchema<const T = unknown, const I extends Schema<T> = Schema<T>> extends Schema<
  T[]
> {
  private readonly schema: Schema<T>;
  private minItems?: number;
  private maxItems?: number;

  /**
   * @param schema - The schema that each array element must conform to (JSON Schema `items`).
   */
  public constructor(schema: I) {
    super();
    this.schema = schema;
  }

  /**
   * Sets the minimum number of items (JSON Schema `minItems`).
   * @param minItems - Minimum allowed length.
   * @returns this for chaining.
   */
  public setMinItems(minItems: number): this {
    this.minItems = minItems;
    return this;
  }

  /**
   * Sets the maximum number of items (JSON Schema `maxItems`).
   * @param maxItems - Maximum allowed length.
   * @returns this for chaining.
   */
  public setMaxItems(maxItems: number): this {
    this.maxItems = maxItems;
    return this;
  }

  /**
   * Validates that the value is an array and that each item conforms to the configured item schema.
   * Also checks `minItems` and `maxItems` constraints if set.
   * @param value - The value to validate.
   * @returns The validated array of item outputs.
   * @throws Error if type or any constraint fails.
   */
  public validate(value: unknown): T[] {
    this.assertType(value);
    this.assertMinItems(value);
    this.assertMaxItems(value);
    return value.map((item, index) => {
      try {
        return this.schema.validate(item);
      } catch (err) {
        /* istanbul ignore else */
        if (err instanceof ValidationError) {
          throw err.withPrefix(index);
        }
        /* istanbul ignore next */
        throw err;
      }
    });
  }

  /**
   * Asserts `maxItems` if configured.
   * @param value - The array to check.
   * @throws Error if `value.length > maxItems`.
   */
  private assertMaxItems(value: unknown[]): void {
    if (this.maxItems === undefined) return;
    if (value.length > this.maxItems) {
      throw new ValidationError(
        'ARRAY_MAX_ITEMS',
        `Expected array length to be at most ${this.maxItems.toString()}.`
      );
    }
  }

  /**
   * Asserts `minItems` if configured.
   * @param value - The array to check.
   * @throws Error if `value.length < minItems`.
   */
  private assertMinItems(value: unknown[]): void {
    if (this.minItems === undefined) return;
    if (value.length < this.minItems) {
      throw new ValidationError(
        'ARRAY_MIN_ITEMS',
        `Expected array length to be at least ${this.minItems.toString()}.`
      );
    }
  }

  /**
   * Asserts the value is an array (`type: array`).
   * @param value - The value to check.
   * @throws Error if value is not an array.
   */
  private assertType(value: unknown): asserts value is unknown[] {
    if (!Array.isArray(value)) {
      throw new ValidationError('ARRAY_TYPE', 'Expected value to be an array.');
    }
  }
}
