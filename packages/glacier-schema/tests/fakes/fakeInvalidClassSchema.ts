import { Schema } from '../../src';

export function fakeInvalidClassSchema() {
  class Test {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/no-explicit-any --- Needed to test invalid schema type
    @Schema({ type: 'invalidType' } as any)
    declare public invalidProperty: string;
  }

  return Test;
}
