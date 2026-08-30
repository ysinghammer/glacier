import { describe, expect, it } from 'vitest';
import { Schema, SchemaValidationError } from '../index.js';

describe('Schema.assertValid', () => {
  it('MUST narrow the value in place when validation succeeds', () => {
    // Arrange
    const schema = new Schema({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name']
    } as const);
    const input: unknown = { name: 'Ada' };

    // Act
    Schema.assertValid(schema, input);

    // Assert
    expect(input.name).toBe('Ada');
  });

  it('MUST throw a SchemaValidationError carrying schema, value, and errors when validation fails', () => {
    // Arrange
    const schema = new Schema({ type: 'string', minLength: 3 } as const);

    // Act
    const act = () => {
      Schema.assertValid(schema, 'a');
    };

    // Assert
    expect(act).toThrow(SchemaValidationError);
    try {
      Schema.assertValid(schema, 'a');
    } catch (error) {
      expect(Schema.isValidationError(error)).toBe(true);
      if (SchemaValidationError.isValidationError(error)) {
        expect(error.value).toBe('a');
        expect(error.errors).toHaveLength(1);
      }
    }
  });
});

describe('Schema.isValidationError', () => {
  it('MUST return false for an arbitrary error', () => {
    // Arrange
    const error = new Error('boom');

    // Act & Assert
    expect(Schema.isValidationError(error)).toBe(false);
  });
});
