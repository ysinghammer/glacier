import { IOC_CONSTRUCTOR_PARAM } from '../reflection/IOC_CONSTRUCTOR_PARAM';

import type { AbstractConstructor } from '@glacier/utils';

export function Resolve(target: AbstractConstructor): ParameterDecorator {
  return (constructor, _, parameterIndex) => {
    IOC_CONSTRUCTOR_PARAM.set(
      parameterIndex,
      { target, isArray: false, isOptional: true },
      constructor
    );
  };
}
