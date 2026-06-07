import { TupleSchemaJson } from '../schemas/TupleSchemaJson';
import { InferType } from '../InferType';
import { SchemaJson } from '../SchemaJson';

export type InferTupleType<T extends TupleSchemaJson> = T['prefixItems'] extends [...infer I]
  ? {
      [K in keyof I]: I[K] extends SchemaJson ? InferType<I[K]> : never;
    }
  : never;
