import { describe, expect, it } from 'vitest';
import { Schema } from '../index.js';

describe('string keywords', () => {
  it('MUST reject a value shorter than minLength', () => {
    const schema = new Schema({ type: 'string', minLength: 3 } as const);
    expect(schema.validate('ab').valid).toBe(false);
    expect(schema.validate('abc').valid).toBe(true);
  });

  it('MUST reject a value longer than maxLength', () => {
    const schema = new Schema({ type: 'string', maxLength: 2 } as const);
    expect(schema.validate('abc').valid).toBe(false);
    expect(schema.validate('ab').valid).toBe(true);
  });

  it('MUST reject a value that does not match pattern', () => {
    const schema = new Schema({ type: 'string', pattern: '^[0-9]{5}$' } as const);
    expect(schema.validate('abcde').valid).toBe(false);
    expect(schema.validate('12345').valid).toBe(true);
  });

  it('MUST enforce the uuid format', () => {
    const schema = new Schema({ type: 'string', format: 'uuid' } as const);
    expect(schema.validate('not-a-uuid').valid).toBe(false);
    expect(schema.validate('123e4567-e89b-12d3-a456-426614174000').valid).toBe(true);
  });

  it('MUST enforce the email format', () => {
    const schema = new Schema({ type: 'string', format: 'email' } as const);
    expect(schema.validate('not-an-email').valid).toBe(false);
    expect(schema.validate('user@example.com').valid).toBe(true);
  });

  it('MUST enforce the date format', () => {
    const schema = new Schema({ type: 'string', format: 'date' } as const);
    expect(schema.validate('2024-13-40').valid).toBe(false);
    expect(schema.validate('not-a-date').valid).toBe(false);
    expect(schema.validate('2024-01-15').valid).toBe(true);
  });

  it('MUST enforce the date-time format', () => {
    const schema = new Schema({ type: 'string', format: 'date-time' } as const);
    expect(schema.validate('2024-01-15').valid).toBe(false);
    expect(schema.validate('not-a-date-time').valid).toBe(false);
    expect(schema.validate('2024-01-15T10:00:00Z').valid).toBe(true);
  });

  it('MUST enforce the time format', () => {
    const schema = new Schema({ type: 'string', format: 'time' } as const);
    expect(schema.validate('10:20').valid).toBe(false);
    expect(schema.validate('10:20:30').valid).toBe(true);
    expect(schema.validate('10:20:30.123Z').valid).toBe(true);
  });

  it('MUST enforce the uri format', () => {
    const schema = new Schema({ type: 'string', format: 'uri' } as const);
    expect(schema.validate('not a uri').valid).toBe(false);
    expect(schema.validate('https://example.com').valid).toBe(true);
  });

  it('MUST enforce the ipv4 format', () => {
    const schema = new Schema({ type: 'string', format: 'ipv4' } as const);
    expect(schema.validate('999.999.999.999').valid).toBe(false);
    expect(schema.validate('192.168.1.1').valid).toBe(true);
  });

  it('MUST enforce the ipv6 format', () => {
    const schema = new Schema({ type: 'string', format: 'ipv6' } as const);
    expect(schema.validate('1:2').valid).toBe(false);
    expect(schema.validate('gggg::1').valid).toBe(false);
    expect(schema.validate('2001:db8::1').valid).toBe(true);
  });

  it('MUST restrict values to the enum list', () => {
    const schema = new Schema({ type: 'string', enum: ['admin', 'member'] } as const);
    expect(schema.validate('owner').valid).toBe(false);
    expect(schema.validate('admin').valid).toBe(true);
  });

  it('MUST restrict values to an exact const', () => {
    const schema = new Schema({ type: 'string', const: 'fixed' } as const);
    expect(schema.validate('other').valid).toBe(false);
    expect(schema.validate('fixed').valid).toBe(true);
  });
});
