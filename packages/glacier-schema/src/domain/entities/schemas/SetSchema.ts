import { Schema } from '../Schema';
import { ArraySchema } from './ArraySchema';
import { ValidationError } from '../../errors/ValidationError';

/**
 * SetSchema
 *
 * Specialization of `ArraySchema` that enforces uniqueness of items, akin to JSON Schema's `uniqueItems`.
 * JSON Schema reference: https://json-schema.org/understanding-json-schema/reference/array.html#uniqueness
 */
export class SetSchema<const O, const S extends Schema<O>> extends ArraySchema<O, S> {
  /**
   * Validates the array using `ArraySchema` and additionally enforces uniqueness (`uniqueItems`).
   * @param value - The value to validate.
   * @returns The validated array with unique items.
   * @throws Error if duplicate items are found.
   */
  public validate(value: unknown): O[] {
    const validatedArray = super.validate(value);
    this.assertUnique(validatedArray);
    return validatedArray;
  }

  /**
   * Internal assertion to ensure all items in the array are unique.
   * @param value - The array to check.
   * @throws Error if duplicate values are present.
   */
  private assertUnique(value: O[]): void {
    const seen = new Map<unknown, number>();
    for (let i = 0; i < value.length; i++) {
      const v = value[i];
      if (seen.has(v)) {
        // attach the current duplicate index; caller will see [i] in the path
        throw new ValidationError(
          'ARRAY_UNIQUE_ITEMS',
          'Expected all items in the set to be unique.',
          [i]
        );
      }
      seen.set(v, i);
    }
  }
}
