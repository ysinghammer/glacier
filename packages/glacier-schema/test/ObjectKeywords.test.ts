import { describe, expect, it } from 'vitest';
import { Schema, UnsupportedSchemaError } from '../index.js';
import type { TSchemaNode } from '../index.js';

describe('object keywords', () => {
  it('MUST default additionalProperties to false and reject unknown properties', () => {
    const schema = new Schema({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name']
    } as const);
    const result = schema.validate({ name: 'Ada', extra: 1 });
    expect(result.valid).toBe(false);
  });

  it('MUST type additionalProperties as an index signature when properties is absent', () => {
    const schema = new Schema({
      type: 'object',
      additionalProperties: { type: 'number' }
    } as const);
    expect(schema.validate({ a: 1, b: 2 }).valid).toBe(true);
    expect(schema.validate({ a: 'not a number' }).valid).toBe(false);
  });

  it('MUST validate propertyNames against a string schema', () => {
    const schema = new Schema({
      type: 'object',
      additionalProperties: true,
      propertyNames: { type: 'string', pattern: '^[a-z]+$' }
    } as const);
    expect(schema.validate({ good: 1 }).valid).toBe(true);
    expect(schema.validate({ Bad: 1 }).valid).toBe(false);
  });

  it('MUST report every missing required property', () => {
    const schema = new Schema({
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'string' } },
      required: ['a', 'b']
    } as const);
    const result = schema.validate({});
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toHaveLength(2);
    }
  });

  it('MUST allow a closed object with no `required` properties at all', () => {
    const schema = new Schema({
      type: 'object',
      properties: { nickname: { type: 'string' } }
    } as const);
    expect(schema.validate({}).valid).toBe(true);
  });

  it('MUST skip every object-shaped keyword check when the root value is not a plain object', () => {
    const schema = new Schema({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
      propertyNames: { type: 'string' }
    } as const);
    const result = schema.validate('not an object');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.map((error) => error.keyword)).toEqual(['type']);
    }
  });

  it('MUST skip additionalProperties/propertyNames checks when the root value is not a plain object', () => {
    const schema = new Schema({
      type: 'object',
      additionalProperties: { type: 'number' },
      propertyNames: { type: 'string' }
    } as const);
    const result = schema.validate('not an object');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.map((error) => error.keyword)).toEqual(['type']);
    }
  });

  it('MUST accept every property when additionalProperties is true', () => {
    const schema = new Schema({ type: 'object', additionalProperties: true } as const);
    expect(schema.validate({ anything: 'goes', here: 1 }).valid).toBe(true);
  });

  it('MUST throw UnsupportedSchemaError when properties is combined with a truthy additionalProperties', () => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- defense-in-depth test bypassing the compile-time type check
    const invalidNode = {
      type: 'object',
      properties: { a: { type: 'string' } },
      additionalProperties: true
    } as unknown as TSchemaNode;
    expect(() => new Schema<TSchemaNode, unknown>(invalidNode)).toThrow(UnsupportedSchemaError);
  });
});
