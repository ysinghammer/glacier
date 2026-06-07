import { MapSchemaJson } from '../schemas/MapSchemaJson';
import { InferType } from '../InferType';

export type InferMapType<S extends MapSchemaJson> = Record<
  string,
  InferType<S['additionalProperties']>
>;
