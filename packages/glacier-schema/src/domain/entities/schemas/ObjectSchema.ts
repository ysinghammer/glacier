import { Schema } from '../Schema';
import { ValidationError } from '../../errors/ValidationError';

type InferObjectType<P extends Record<string, Schema>, R extends (keyof P)[]> = {
  [K in R[number]]: P[K] extends Schema<infer T> ? T : never;
} & {
  [K in Exclude<keyof P, R[number]>]?: P[K] extends Schema<infer T> ? T : never;
};

/**
 * ObjectSchema
 *
 * Represents a JSON Schema `type: "object"` validator for a fixed set of properties.
 * Supports modeling of:
 * - `properties` (shape definition): https://json-schema.org/understanding-json-schema/reference/object.html#properties
 * - `required` (which properties must be present): https://json-schema.org/understanding-json-schema/reference/object.html#required-properties
 */
export class ObjectSchema<
  const P extends Record<string, Schema> = Record<string, Schema>,
  const R extends (keyof P)[] = (keyof P)[]
> extends Schema<InferObjectType<P, R>> {
  private readonly requiredProperties: Set<string | number | symbol>;
  private readonly properties: P;

  /**
   * @param properties - Map of property names to their respective schemas.
   * @param required - List of required property names.
   */
  public constructor(properties: P, required: R) {
    super();
    this.requiredProperties = new Set(required);
    this.properties = properties;
  }

  /**
   * Validates that the value is an object, required properties exist, and values conform to their schemas.
   * @param value - The object to validate.
   * @returns A new object containing validated values for present properties.
   * @throws ValidationError if type or any property constraint fails.
   */
  public validate(value: unknown): InferObjectType<P, R> {
    this.assertType(value);
    this.assertPropertiesExist(value);
    return this.transformObject(value);
  }

  /**
   * Transforms and validates each defined property for objects that contain them.
   * This is analogous to JSON Schema `properties` application.
   * @param value - The object to validate.
   * @returns The validated and transformed object.
   */
  private transformObject(value: { [K in keyof P]: unknown }): InferObjectType<P, R> {
    const transformedObject: Record<string, unknown> = {};

    for (const propertyName in this.properties) {
      if (!(propertyName in value)) continue;
      try {
        const currentValue: unknown = value[propertyName];
        transformedObject[propertyName] = this.properties[propertyName].validate(currentValue);
      } catch (err) {
        /* istanbul ignore else */
        if (err instanceof ValidationError) {
          throw err.withPrefix(propertyName);
        }
        /* istanbul ignore next */
        throw err;
      }
    }

    /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --
     * There is currently no way to build an object dynamically in TypeScript and have it
     * retain the correct type information without an explicit cast.
     */
    return transformedObject as InferObjectType<P, R>;
  }

  /**
   * Asserts that all required properties exist.
   * @param value - The object to check.
   * @throws ValidationError naming the missing property.
   */
  private assertPropertiesExist(value: object): asserts value is { [K in keyof P]: unknown } {
    this.requiredProperties.forEach((propertyName) => {
      if (!(propertyName in value)) {
        throw new ValidationError(
          'OBJECT_REQUIRED',
          `Missing required property: ${propertyName.toString()}`
        );
      }
    });
  }

  /**
   * Asserts the value is a non-null object and not an array (`type: object`).
   * @param value - The value to check.
   * @throws ValidationError if not a plain object.
   */
  private assertType(value: unknown): asserts value is object {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ValidationError('OBJECT_TYPE', 'Expected value to be an object.');
    }
  }
}
