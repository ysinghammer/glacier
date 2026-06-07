import type { AbstractConstructor } from '@glacier/utils';

export interface ConstructorParamMeta {
  target: AbstractConstructor;
  isArray: boolean;
  isOptional: boolean;
}
