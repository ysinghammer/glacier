import { IOC_CONSTRUCTOR_PARAM } from '../reflection/IOC_CONSTRUCTOR_PARAM';

import type { AbstractConstructor } from '@glacier/utils';

export function ResolveAll(target: AbstractConstructor): ParameterDecorator {
  return (constructor, _, parameterIndex) => {
    IOC_CONSTRUCTOR_PARAM.set(
      parameterIndex,
      { target, isArray: true, isOptional: false },
      constructor
    );
  };
}
