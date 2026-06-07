import { ObjectSchemaJson } from '../schemas/ObjectSchemaJson';
import { InferType } from '../InferType';

export type InferObjectType<T extends ObjectSchemaJson> =
  T['required'] extends readonly (keyof T['properties'])[]
    ? { [K in T['required'][number]]: InferType<T['properties'][K]> } & {
        [K in Exclude<keyof T['properties'], T['required'][number]>]?: InferType<
          T['properties'][K]
        >;
      }
    : { [K in T['required'][number]]: InferType<T['properties'][K]> };
