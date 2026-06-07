import { EnvValueType } from './EnvValueType';
import { InferEnvValueType } from './InferEnvValue';

export interface EnvValueSchema<T extends EnvValueType = EnvValueType> {
  key: string;
  type: T;
  defaultValue?: InferEnvValueType<T>;
  isArray?: true;
}
