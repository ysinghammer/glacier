import { describe, expect, it } from 'vitest';
import { Schema } from '../index.js';

describe('numeric keywords', () => {
  it('MUST enforce minimum and maximum', () => {
    const schema = new Schema({ type: 'number', minimum: 0, maximum: 10 } as const);
    expect(schema.validate(-1).valid).toBe(false);
    expect(schema.validate(11).valid).toBe(false);
    expect(schema.validate(5).valid).toBe(true);
  });

  it('MUST enforce exclusiveMinimum and exclusiveMaximum', () => {
    const schema = new Schema({
      type: 'number',
      exclusiveMinimum: 0,
      exclusiveMaximum: 10
    } as const);
    expect(schema.validate(0).valid).toBe(false);
    expect(schema.validate(10).valid).toBe(false);
    expect(schema.validate(5).valid).toBe(true);
  });

  it('MUST enforce multipleOf using a scale-to-integer comparison', () => {
    const schema = new Schema({ type: 'number', multipleOf: 0.01 } as const);
    expect(schema.validate(1.1).valid).toBe(true);
    expect(schema.validate(1.001).valid).toBe(false);
  });

  it('MUST enforce multipleOf for a divisor with no decimal part', () => {
    const schema = new Schema({ type: 'number', multipleOf: 2 } as const);
    expect(schema.validate(4).valid).toBe(true);
    expect(schema.validate(3).valid).toBe(false);
  });

  it('MUST skip the multipleOf check when the value is not a number', () => {
    const schema = new Schema({ type: 'number', multipleOf: 2 } as const);
    const result = schema.validate('not a number');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.map((error) => error.keyword)).toEqual(['type']);
    }
  });

  it('MUST restrict values to the enum list', () => {
    const schema = new Schema({ type: 'number', enum: [1, 2] } as const);
    expect(schema.validate(3).valid).toBe(false);
    expect(schema.validate(1).valid).toBe(true);
  });

  it('MUST restrict values to an exact const', () => {
    const schema = new Schema({ type: 'number', const: 7 } as const);
    expect(schema.validate(8).valid).toBe(false);
    expect(schema.validate(7).valid).toBe(true);
  });

  it('MUST reject non-integers when type is integer', () => {
    const schema = new Schema({ type: 'integer' } as const);
    expect(schema.validate(1.5).valid).toBe(false);
    expect(schema.validate(1).valid).toBe(true);
  });
});
