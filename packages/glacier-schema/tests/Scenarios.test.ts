import { ClassSchemaFactory, JsonSchemaFactory, SchemaJson, ValidationError } from '../src';
import { fakeJsonSchema } from './fakes/fakeJsonSchema';
import { fakeValidObject } from './fakes/fakeValidObject';
import { FakeClassSchema } from './fakes/fakeClassSchema';
import { fakeInvalidClassSchema } from './fakes/fakeInvalidClassSchema';
import { fakeClassSchemaWithSymbols } from './fakes/fakeClassSchemaWithSymbols';
import { fakeClassSchemaWithMissingProp } from './fakes/fakeClassSchemaWithMissingProp';
import { fakeErrorSchema } from './fakes/fakeErrorSchema';

describe('Scenarios @glacier/schema', () => {
  test('Scenario 1: Validate if JsonSchema is valid', () => {
    const jsonSchema = fakeJsonSchema();
    const schema = JsonSchemaFactory.createSchema(jsonSchema);
    const validObject = fakeValidObject();
    expect(schema.isValid(validObject)).toBe(true);
  });

  test('Scenario 2: Throws an error if schema is invalid', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --- Test if an invalid runtime schema throws an error
    const jsonSchema = { type: 'bla' } as unknown as SchemaJson;
    expect(() => JsonSchemaFactory.createSchema(jsonSchema)).toThrow('Unsupported schema type');
  });

  test('Scenario 3: Validate if ClassSchema is valid', () => {
    const schema = ClassSchemaFactory.createSchema(FakeClassSchema);
    const validObject = fakeValidObject();
    expect(schema.isValid(validObject)).toBe(true);
  });

  test('Scenario 4: Throws an error if class schema is invalid', () => {
    const InvalidSchema = fakeInvalidClassSchema();
    expect(() => ClassSchemaFactory.createSchema(InvalidSchema)).toThrow('Unsupported schema type');
  });

  test('Scenario 5: Throws an error if class schema is invalid', () => {
    const InvalidSchema = fakeClassSchemaWithSymbols();
    expect(() => ClassSchemaFactory.createSchema(InvalidSchema)).toThrow(
      'Symbol properties are not supported in ClassSchemaFactory.'
    );
  });

  test('Scenario 6: Throws an error if class schema is invalid', () => {
    const schema = ClassSchemaFactory.createSchema(fakeClassSchemaWithMissingProp());
    expect(schema.isValid({ age: 3 })).toBe(true);
  });

  test('Scenario 7: Returns false if a schema is not valid without throwing', () => {
    const jsonSchema = fakeJsonSchema();
    const schema = JsonSchemaFactory.createSchema(jsonSchema);
    expect(schema.isValid({})).toBe(false);
  });

  test('Scenario 8: Builds the correct field path for the error message', () => {
    const jsonSchema = fakeErrorSchema();
    const schema = JsonSchemaFactory.createSchema(jsonSchema);
    try {
      schema.validate({ address: [{ street: 123 }] });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.toPathString()).toBe('$.address[0].street');
      }
    }
  });

  // StringSchema validation error tests
  test('Scenario 9: STRING_TYPE - Throws error when value is not a string', () => {
    const schema = JsonSchemaFactory.createSchema({ type: 'string' });
    expect(() => schema.validate(123)).toThrow('Expected value to be a string.');
  });

  test('Scenario 10: STRING_MIN_LENGTH - Throws error when string is too short', () => {
    const schema = JsonSchemaFactory.createSchema({ type: 'string', minLength: 5 });
    expect(() => schema.validate('abc')).toThrow('Expected string length to be at least 5.');
  });

  test('Scenario 11: STRING_MAX_LENGTH - Throws error when string is too long', () => {
    const schema = JsonSchemaFactory.createSchema({ type: 'string', maxLength: 5 });
    expect(() => schema.validate('abcdefgh')).toThrow('Expected string length to be at most 5.');
  });

  test('Scenario 12: STRING_PATTERN - Throws error when string does not match pattern', () => {
    const schema = JsonSchemaFactory.createSchema({ type: 'string', pattern: '^[a-z]+$' });
    expect(() => schema.validate('ABC123')).toThrow('String does not match the required pattern');
  });

  // NumberSchema validation error tests
  test('Scenario 13: NUMBER_TYPE - Throws error when value is not a number', () => {
    const schema = JsonSchemaFactory.createSchema({ type: 'number' });
    expect(() => schema.validate('not a number')).toThrow('Expected value to be a number.');
  });

  test('Scenario 14: NUMBER_MINIMUM - Throws error when number is below minimum', () => {
    const schema = JsonSchemaFactory.createSchema({ type: 'number', minimum: 10 });
    expect(() => schema.validate(5)).toThrow('Expected value to be greater than or equal to 10.');
  });

  test('Scenario 15: NUMBER_MAXIMUM - Throws error when number exceeds maximum', () => {
    const schema = JsonSchemaFactory.createSchema({ type: 'number', maximum: 10 });
    expect(() => schema.validate(15)).toThrow('Expected value to be less than or equal to 10.');
  });

  test('Scenario 16: NUMBER_EXCLUSIVE_MINIMUM - Throws error when number equals exclusive minimum', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'number',
      minimum: 10,
      exclusiveMinimum: true
    });
    expect(() => schema.validate(10)).toThrow('Expected value to be greater than 10.');
  });

  test('Scenario 17: NUMBER_EXCLUSIVE_MAXIMUM - Throws error when number equals exclusive maximum', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'number',
      maximum: 10,
      exclusiveMaximum: true
    });
    expect(() => schema.validate(10)).toThrow('Expected value to be less than 10.');
  });

  test('Scenario 18: NUMBER_MULTIPLE_OF - Throws error when number is not a multiple', () => {
    const schema = JsonSchemaFactory.createSchema({ type: 'number', multipleOf: 5 });
    expect(() => schema.validate(13)).toThrow('Expected value to be a multiple of 5.');
  });

  // IntegerSchema validation error tests
  test('Scenario 19: INTEGER_TYPE - Throws error when value is not an integer', () => {
    const schema = JsonSchemaFactory.createSchema({ type: 'integer' });
    expect(() => schema.validate(3.14)).toThrow('Expected value to be an integer.');
  });

  // BooleanSchema validation error tests
  test('Scenario 20: BOOLEAN_TYPE - Throws error when value is not a boolean', () => {
    const schema = JsonSchemaFactory.createSchema({ type: 'boolean' });
    expect(() => schema.validate('true')).toThrow('Expected value to be a boolean.');
  });

  // NullSchema validation error tests
  test('Scenario 21: NULL_TYPE - Throws error when value is not null', () => {
    const schema = JsonSchemaFactory.createSchema({ type: 'null' });
    expect(() => schema.validate(undefined)).toThrow('Expected value to be null.');
  });

  // ArraySchema validation error tests
  test('Scenario 22: ARRAY_TYPE - Throws error when value is not an array', () => {
    const schema = JsonSchemaFactory.createSchema({ type: 'array', items: { type: 'string' } });
    expect(() => schema.validate('not an array')).toThrow('Expected value to be an array.');
  });

  test('Scenario 23: ARRAY_MIN_ITEMS - Throws error when array has too few items', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'array',
      items: { type: 'string' },
      minItems: 3
    });
    expect(() => schema.validate(['a', 'b'])).toThrow('Expected array length to be at least 3.');
  });

  test('Scenario 24: ARRAY_MAX_ITEMS - Throws error when array has too many items', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'array',
      items: { type: 'string' },
      maxItems: 2
    });
    expect(() => schema.validate(['a', 'b', 'c'])).toThrow(
      'Expected array length to be at most 2.'
    );
  });

  // TupleSchema validation error tests
  test('Scenario 25: ARRAY_TUPLE_LENGTH - Throws error when tuple length is incorrect', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'array',
      items: false,
      prefixItems: [{ type: 'string' }, { type: 'number' }]
    });
    expect(() => schema.validate(['test'])).toThrow('Expected tuple length to be exactly 2.');
  });

  // SetSchema validation error tests
  test('Scenario 26: ARRAY_UNIQUE_ITEMS - Throws error when array has duplicate items', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'array',
      items: { type: 'string' },
      uniqueItems: true
    });
    expect(() => schema.validate(['a', 'b', 'a'])).toThrow(
      'Expected all items in the set to be unique.'
    );
  });

  // ObjectSchema validation error tests
  test('Scenario 27: OBJECT_TYPE - Throws error when value is not an object', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: []
    });
    expect(() => schema.validate('not an object')).toThrow('Expected value to be an object.');
  });

  test('Scenario 28: OBJECT_REQUIRED - Throws error when required property is missing', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name']
    });
    expect(() => schema.validate({})).toThrow('Missing required property: name');
  });

  // MapSchema validation error tests
  test('Scenario 29: OBJECT_MIN_PROPERTIES - Throws error when object has too few properties', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'object',
      additionalProperties: { type: 'string' },
      minProperties: 2
    });
    expect(() => schema.validate({ a: 'test' })).toThrow(
      'Object has fewer properties (1) than the minimum required (2).'
    );
  });

  test('Scenario 30: OBJECT_MAX_PROPERTIES - Throws error when object has too many properties', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'object',
      additionalProperties: { type: 'string' },
      maxProperties: 1
    });
    expect(() => schema.validate({ a: 'test', b: 'test2' })).toThrow(
      'Object has more properties (2) than the maximum allowed (1).'
    );
  });

  test('Scenario 31: MAP_PROPERTY_NAMES - Validates property names match schema', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'object',
      additionalProperties: { type: 'string' },
      propertyNames: { type: 'string', pattern: '^[a-z]+$' }
    });
    expect(() => schema.validate({ ABC: 'test' })).toThrow(
      'String does not match the required pattern'
    );
  });

  test('Scenario 32: MAP_PATTERN_PROPERTIES - Validates pattern properties', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'object',
      additionalProperties: { type: 'string' },
      patternProperties: {
        '^num_': { type: 'number' }
      }
    });
    expect(() => schema.validate({ num_age: 'not a number' })).toThrow(
      'Expected value to be a number.'
    );
  });

  // ConstSchema validation error tests
  test('Scenario 33: CONST_MISMATCH - Throws error when value does not match constant', () => {
    const schema = JsonSchemaFactory.createSchema({ const: 'exact-value' });
    expect(() => schema.validate('wrong-value')).toThrow(
      'Expected value to be constant \'"exact-value"\''
    );
  });

  // EnumSchema validation error tests
  test('Scenario 34: ENUM_MISMATCH - Throws error when value is not in enum', () => {
    const schema = JsonSchemaFactory.createSchema({ enum: ['red', 'green', 'blue'] });
    expect(() => schema.validate('yellow')).toThrow('Expected value to be one of');
  });

  // UnionSchema validation error tests
  test('Scenario 35: UNION_NO_MATCH - Throws error when value matches no union member', () => {
    const schema = JsonSchemaFactory.createSchema({
      oneOf: [
        { type: 'object', properties: { type: { const: 'A' } }, required: ['type'] },
        { type: 'object', properties: { type: { const: 'B' } }, required: ['type'] }
      ]
    });
    expect(() => schema.validate({ type: 'C' })).toThrow(
      'Value does not match any schema in the union.'
    );
  });

  // Edge cases for better coverage
  test('Scenario 36: Validates object with null value', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'object',
      properties: { value: { type: 'null' } },
      required: ['value']
    });
    expect(schema.isValid({ value: null })).toBe(true);
  });

  test('Scenario 37: Validates nested array validation error paths', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'array',
      items: {
        type: 'array',
        items: { type: 'number' }
      }
    });
    try {
      schema.validate([
        [1, 2],
        [3, 'invalid']
      ]);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.toPathString()).toBe('$[1][1]');
      }
    }
  });

  test('Scenario 38: Validates tuple with type errors', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'array',
      items: false,
      prefixItems: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }]
    });
    expect(() => schema.validate(['test', 'not-a-number', true])).toThrow(
      'Expected value to be a number.'
    );
  });

  test('Scenario 39: Validates map additional properties type error', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'object',
      additionalProperties: { type: 'number' }
    });
    expect(() => schema.validate({ age: 'not-a-number' })).toThrow(
      'Expected value to be a number.'
    );
  });

  test('Scenario 40: Validates that a tuple is of type array', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'array',
      items: false,
      prefixItems: [{ type: 'string' }, { type: 'number' }]
    });
    expect(() => schema.validate(3)).toThrow('Expected value to be an array.');
  });

  test('Scenario 41: Validates that a Map is of type object', () => {
    const schema = JsonSchemaFactory.createSchema({
      type: 'object',
      additionalProperties: { type: 'string' }
    });
    expect(() => schema.validate(3)).toThrow('Expected value to be an object.');
  });
});
