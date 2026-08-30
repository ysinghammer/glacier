import { describe, expectTypeOf, it } from 'vitest';
import { Schema } from '../index.js';
import type { Infer } from '../index.js';

describe('Infer', () => {
  it('MUST infer string for a string schema', () => {
    const schema = new Schema({ type: 'string' } as const);
    expectTypeOf<Infer<typeof schema>>().toEqualTypeOf<string>();
  });

  it('MUST infer a union of literals for an enum schema', () => {
    const schema = new Schema({ type: 'string', enum: ['a', 'b'] } as const);
    expectTypeOf<Infer<typeof schema>>().toEqualTypeOf<'a' | 'b'>();
  });

  it('MUST infer number for integer and number schemas', () => {
    const schema = new Schema({ type: 'integer' } as const);
    expectTypeOf<Infer<typeof schema>>().toEqualTypeOf<number>();
  });

  it('MUST infer boolean for a boolean schema', () => {
    const schema = new Schema({ type: 'boolean' } as const);
    expectTypeOf<Infer<typeof schema>>().toEqualTypeOf<boolean>();
  });

  it('MUST infer an interface with optional keys absent from required', () => {
    const schema = new Schema({
      type: 'object',
      properties: {
        id: { type: 'string' },
        age: { type: 'integer' }
      },
      required: ['id']
    } as const);
    expectTypeOf<Infer<typeof schema>>().toEqualTypeOf<{ id: string; age?: number }>();
  });

  it('MUST infer an index signature for an open object', () => {
    const schema = new Schema({
      type: 'object',
      additionalProperties: { type: 'number' }
    } as const);
    expectTypeOf<Infer<typeof schema>>().toEqualTypeOf<Record<string, number>>();
  });

  it('MUST infer an array element type for `items`', () => {
    const schema = new Schema({ type: 'array', items: { type: 'string' } } as const);
    expectTypeOf<Infer<typeof schema>>().toEqualTypeOf<string[]>();
  });

  it('MUST infer a tuple type for `prefixItems`', () => {
    const schema = new Schema({
      type: 'array',
      prefixItems: [{ type: 'string' }, { type: 'number' }]
    } as const);
    expectTypeOf<Infer<typeof schema>>().toEqualTypeOf<[string, number]>();
  });

  it('MUST infer a union of branch types for `oneOf`', () => {
    const schema = new Schema({ oneOf: [{ type: 'string' }, { type: 'number' }] } as const);
    expectTypeOf<Infer<typeof schema>>().toEqualTypeOf<string | number>();
  });
});
