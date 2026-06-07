import { TupleSchemaJson } from '../schemas/TupleSchemaJson';
import { InferSchema } from '../InferSchema';
import { TupleSchema } from '../../../domain/entities/schemas/TupleSchema';
import { SchemaJson } from '../SchemaJson';

export type InferTupleSchema<S extends TupleSchemaJson> = TupleSchema<
  S['prefixItems'] extends [...infer I]
    ? {
        [K in keyof I]: I[K] extends SchemaJson ? InferSchema<I[K]> : never;
      }
    : never
>;
