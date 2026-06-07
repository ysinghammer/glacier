import { Schema } from '../Schema';
import { ObjectSchema } from './ObjectSchema';
import { ValidationError } from '../../errors/ValidationError';

type InferUnionSchema<I extends ObjectSchema> = I extends Schema<infer T> ? T : never;

/**
 * UnionSchema
 *
 * Represents a union of object schemas similar in spirit to JSON Schema's `oneOf` keyword, where the instance
 * must validate against exactly one of the provided schemas (this implementation checks for first success).
 * JSON Schema reference: https://json-schema.org/understanding-json-schema/reference/combining.html#oneof
 */
export class UnionSchema<const S extends ObjectSchema> extends Schema<InferUnionSchema<S>> {
  private readonly schemas: S[];

  /**
   * @param schemas - An array of `ObjectSchema` instances to try during validation.
   */
  public constructor(schemas: S[]) {
    super();
    this.schemas = schemas;
  }

  /**
   * Validates the value against the list of schemas and returns on first success.
   * If a schema throws a `ValidationError`, the next schema is tried. Any other error type is rethrown.
   * @param value - The value to validate.
   * @returns The validated value from the first matching schema.
   * @throws ValidationError if none of the schemas match.
   */
  public validate(value: unknown): InferUnionSchema<S> {
    for (const schema of this.schemas) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- we trust the schema to validate correctly
        return schema.validate(value) as InferUnionSchema<S>;
      } catch (error: unknown) {
        /* istanbul ignore if */
        if (!(error instanceof ValidationError)) {
          throw error;
        }
      }
    }
    throw new ValidationError('UNION_NO_MATCH', 'Value does not match any schema in the union.');
  }
}
