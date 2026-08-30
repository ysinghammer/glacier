import { describe, expect, it } from 'vitest';
import { Schema } from '../index.js';

describe('Schema', () => {
  it('MUST return valid: true with the parsed data when the value matches the schema', () => {
    // Arrange
    const userSchema = new Schema({
      type: 'object',
      properties: {
        id: { type: 'string' },
        age: { type: 'integer', minimum: 0 }
      },
      required: ['id']
    } as const);

    // Act
    const result = userSchema.validate({ id: 'abc', age: 42 });

    // Assert
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).toEqual({ id: 'abc', age: 42 });
    }
  });

  it('MUST collect every validation error instead of stopping at the first one', () => {
    // Arrange
    const userSchema = new Schema({
      type: 'object',
      properties: {
        id: { type: 'string', minLength: 3 },
        age: { type: 'integer', minimum: 0 }
      },
      required: ['id', 'age']
    } as const);

    // Act
    const result = userSchema.validate({ id: 'a', age: -1 });

    // Assert
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toHaveLength(2);
      expect(result.errors.map((error) => error.keyword).sort()).toEqual(['minLength', 'minimum']);
    }
  });

  it('MUST never throw when given a value that fails validation', () => {
    // Arrange
    const schema = new Schema({ type: 'string' } as const);

    // Act
    const act = () => schema.validate(123);

    // Assert
    expect(act).not.toThrow();
  });

  it('MUST expose metadata keywords on `.meta` without affecting validation', () => {
    // Arrange
    const schema = new Schema({
      type: 'string',
      description: 'A short label',
      deprecated: true
    } as const);

    // Act
    const result = schema.validate('hello');

    // Assert
    expect(schema.meta.description).toBe('A short label');
    expect(schema.meta.deprecated).toBe(true);
    expect(result.valid).toBe(true);
  });

  it('MUST validate an embedded `Schema` instance used as a nested property value', () => {
    // Arrange
    const addressSchema = new Schema({
      type: 'object',
      properties: { zip: { type: 'string', pattern: '^[0-9]{5}$' } },
      required: ['zip']
    } as const);
    const userSchema = new Schema({
      type: 'object',
      properties: { name: { type: 'string' }, address: addressSchema },
      required: ['name', 'address']
    } as const);

    // Act
    const result = userSchema.validate({ name: 'Ada', address: { zip: 'abcde' } });

    // Assert
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0]?.path).toEqual(['address', 'zip']);
    }
  });
});
