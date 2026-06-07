import { EnvValueType } from './EnvValueType';

export type InferEnvValueType<T extends EnvValueType> = T extends 'string'
  ? string
  : T extends 'number'
    ? number
    : T extends 'boolean'
      ? boolean
      : never;
