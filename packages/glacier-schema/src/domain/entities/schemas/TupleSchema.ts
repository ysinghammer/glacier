import { Schema } from '../Schema';
import { ValidationError } from '../../errors/ValidationError';

type InferTupleSchema<I extends Schema[]> = {
  [K in keyof I]: I[K] extends Schema<infer T> ? T : never;
};

/**
 * TupleSchema
 *
 * Represents tuple validation for arrays with a fixed number of positions, each position having its own schema.
 * This models the JSON Schema array form with positional validation (commonly expressed via `items` as an array).
 * JSON Schema reference: https://json-schema.org/understanding-json-schema/reference/array.html#items
 */
export class TupleSchema<const I extends Schema[]> extends Schema<InferTupleSchema<I>> {
  private readonly tuple: I;

  /**
   * @param schema - An array of schemas; each index corresponds to the expected type at that position.
   */
  public constructor(schema: I) {
    super();
    this.tuple = schema;
  }

  /**
   * Validates that the value is an array of exactly the tuple length, and each element matches the schema at its index.
   * @param value - The value to validate.
   * @returns The validated tuple as an array of outputs from each schema.
   * @throws Error if type, length, or any item validation fails.
   */
  public validate(value: unknown): InferTupleSchema<I> {
    this.assertType(value);
    this.assertLength(value);

    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
     * There is currently no way to build an tuple dynamically in TypeScript and have it
     * retain the correct type information without an explicit cast.
     */
    return value.map((item, index) => {
      const schema = this.tuple[index];
      try {
        return schema.validate(item);
      } catch (err) {
        /* istanbul ignore else */
        if (err instanceof ValidationError) {
          throw err.withPrefix(index);
        }
        /* istanbul ignore next */
        throw err;
      }
    }) as InferTupleSchema<I>;
  }

  /**
   * Asserts the array has exactly the same length as the tuple schema definitions.
   * @param value - The array to check.
   * @throws Error if lengths differ.
   */
  private assertLength(value: unknown[]): void {
    if (value.length !== this.tuple.length) {
      throw new ValidationError(
        'ARRAY_TUPLE_LENGTH',
        `Expected tuple length to be exactly ${this.tuple.length.toString()}.`
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
