import { REFLECT_INSTANCE } from './application/constants/REFLECT_INSTANCE';

export * from './domain/interfaces/PropertyKey';
export * from './application/ReadonlyReflection';
export * from './application/Reflection';
export * from './application/ReflectionMap';
export * from './application/ReflectionSet';
export * from './application/constants/DESIGN_PARAM_TYPES';
export * from './application/constants/DESIGN_TYPE';
export * from './application/constants/DESIGN_RETURN_TYPE';

export const reflect = REFLECT_INSTANCE;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace --- Needed for global augmentation
  namespace Reflect {
    let metadata: typeof REFLECT_INSTANCE.metadata;
  }
}

Object.assign(globalThis.Reflect, {
  metadata: REFLECT_INSTANCE.metadata.bind(REFLECT_INSTANCE)
});
