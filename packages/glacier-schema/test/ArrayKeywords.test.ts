import { describe, expect, it } from 'vitest';
import { Schema } from '../index.js';

describe('array keywords', () => {
  it('MUST validate every element against items', () => {
    const schema = new Schema({ type: 'array', items: { type: 'number' } } as const);
    expect(schema.validate([1, 2, 3]).valid).toBe(true);
    expect(schema.validate([1, 'two']).valid).toBe(false);
  });

  it('MUST validate a tuple positionally via prefixItems', () => {
    const schema = new Schema({
      type: 'array',
      prefixItems: [{ type: 'string' }, { type: 'number' }]
    } as const);
    expect(schema.validate(['a', 1]).valid).toBe(true);
    expect(schema.validate([1, 'a']).valid).toBe(false);
  });

  it('MUST validate trailing elements against `items` beyond the tuple prefix', () => {
    const schema = new Schema({
      type: 'array',
      prefixItems: [{ type: 'string' }],
      items: { type: 'number' }
    } as const);
    expect(schema.validate(['a', 1, 2]).valid).toBe(true);
    expect(schema.validate(['a', 1, 'not a number']).valid).toBe(false);
  });

  it('MUST skip every array-shaped keyword check when the root value is not an array', () => {
    const schema = new Schema({
      type: 'array',
      prefixItems: [{ type: 'string' }],
      contains: { type: 'number' },
      uniqueItems: true
    } as const);
    const result = schema.validate('not an array');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.map((error) => error.keyword)).toEqual(['type']);
    }
  });

  it('MUST enforce contains/minContains/maxContains', () => {
    const schema = new Schema({
      type: 'array',
      items: { type: 'number' },
      contains: { type: 'number', minimum: 10 },
      minContains: 2
    } as const);
    expect(schema.validate([1, 2, 3]).valid).toBe(false);
    expect(schema.validate([1, 11, 12]).valid).toBe(true);
  });

  it('MUST reject when more items match contains than maxContains allows', () => {
    const schema = new Schema({
      type: 'array',
      items: { type: 'number' },
      contains: { type: 'number', minimum: 10 },
      maxContains: 1
    } as const);
    expect(schema.validate([11, 12]).valid).toBe(false);
    expect(schema.validate([11]).valid).toBe(true);
  });

  it('MUST enforce uniqueItems', () => {
    const schema = new Schema({
      type: 'array',
      items: { type: 'number' },
      uniqueItems: true
    } as const);
    expect(schema.validate([1, 2, 2]).valid).toBe(false);
    expect(schema.validate([1, 2, 3]).valid).toBe(true);
  });

  it('MUST enforce uniqueItems using deep structural equality for objects and arrays', () => {
    const schema = new Schema({
      type: 'array',
      items: { type: 'object', additionalProperties: true },
      uniqueItems: true
    } as const);
    expect(schema.validate([{ a: [1, 2] }, { a: [1, 2] }]).valid).toBe(false);
    expect(schema.validate([{ a: [1, 2] }, { a: [1, 3] }]).valid).toBe(true);
    expect(schema.validate([{ a: 1 }, { a: 1, b: 2 }]).valid).toBe(true);
  });

  it('MUST treat an array and a plain object as unequal for uniqueItems purposes', () => {
    const schema = new Schema({
      type: 'array',
      items: {
        oneOf: [
          { type: 'array', items: { type: 'number' } },
          { type: 'object', additionalProperties: true }
        ]
      },
      uniqueItems: true
    } as const);
    expect(schema.validate([[1, 2], { 0: 1, 1: 2 }]).valid).toBe(true);
  });
});
