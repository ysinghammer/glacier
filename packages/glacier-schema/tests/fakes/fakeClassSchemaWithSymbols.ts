import { Schema } from '../../src';

export function fakeClassSchemaWithSymbols() {
  const prop = Symbol('prop');

  class Test {
    @Schema({ type: 'string' })
    public [prop] = 'test';
  }

  return Test;
}
