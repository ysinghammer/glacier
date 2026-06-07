import { EnvValueSchema } from './EnvValueSchema';
import { InferEnvValueType } from './InferEnvValue';

export type InferEnvValueSchema<S extends EnvValueSchema> = S['isArray'] extends true
  ? Array<InferEnvValueType<S['type']>>
  : InferEnvValueType<S['type']>;
