import { describe, expect, it } from 'vitest';
import { Schema, UnsupportedSchemaError } from '../index.js';
import type { TSchemaNode } from '../index.js';

describe('oneOf', () => {
  it('MUST succeed when exactly one branch matches', () => {
    const schema = new Schema({
      oneOf: [{ type: 'string' }, { type: 'number' }]
    } as const);
    expect(schema.validate('a').valid).toBe(true);
    expect(schema.validate(1).valid).toBe(true);
  });

  it('MUST fail when zero branches match', () => {
    const schema = new Schema({ oneOf: [{ type: 'string' }, { type: 'number' }] } as const);
    expect(schema.validate(true).valid).toBe(false);
  });

  it('MUST fail when more than one branch matches', () => {
    const schema = new Schema({
      oneOf: [{ type: 'number' }, { type: 'number', minimum: 0 }]
    } as const);
    expect(schema.validate(5).valid).toBe(false);
  });

  it('MUST throw UnsupportedSchemaError when `type` and `oneOf` are combined', () => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- defense-in-depth test bypassing the compile-time type check
    const invalidNode = {
      type: 'string',
      oneOf: [{ type: 'string' }, { type: 'number' }]
    } as unknown as TSchemaNode;
    expect(() => new Schema<TSchemaNode, unknown>(invalidNode)).toThrow(UnsupportedSchemaError);
  });
});

describe('unsupported schema nodes', () => {
  it('MUST throw UnsupportedSchemaError for a node with no recognized type or oneOf', () => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- defense-in-depth test bypassing the compile-time type check
    const invalidNode = {
      type: 'null'
    } as unknown as TSchemaNode;
    expect(() => new Schema<TSchemaNode, unknown>(invalidNode)).toThrow(UnsupportedSchemaError);
  });
});
