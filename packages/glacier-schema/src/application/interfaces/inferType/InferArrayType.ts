import { ArraySchemaJson } from '../schemas/ArraySchemaJson';
import { InferType } from '../InferType';

export type InferArrayType<T extends ArraySchemaJson> = T extends ArraySchemaJson
  ? InferType<T['items']>[]
  : never;
