import { reflect } from '@glacier/reflection';

import { Schema } from '../../src';

export function fakeClassSchemaWithMissingProp() {
  function Dec(): PropertyDecorator {
    return (target, propertyKey) => {
      reflect.defineMetadata('t', 'x', target, propertyKey);
    };
  }

  class T {
    @Dec()
    declare public n: string;

    @Schema({ type: 'integer' })
    declare public age: number;
  }

  return T;
}
