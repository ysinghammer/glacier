import { UnionSchemaJson } from '../schemas/UnionSchemaJson';
import { UnionSchema } from '../../../domain/entities/schemas/UnionSchema';
import { InferSchema } from '../InferSchema';
import { SchemaJson } from '../SchemaJson';

export type InferUnionSchema<S extends UnionSchemaJson> = UnionSchema<
  S['oneOf'] extends [...infer I]
    ? {
        [K in keyof I]: I[K] extends SchemaJson ? InferSchema<I[K]> : never;
      }[number]
    : never
>;
