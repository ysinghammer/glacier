import { UnionSchemaJson } from '../schemas/UnionSchemaJson';
import { InferType } from '../InferType';
import { SchemaJson } from '../SchemaJson';

export type InferUnionType<T extends UnionSchemaJson> = T['oneOf'] extends [...infer I]
  ? {
      [K in keyof I]: I[K] extends SchemaJson ? InferType<I[K]> : never;
    }[number]
  : never;
