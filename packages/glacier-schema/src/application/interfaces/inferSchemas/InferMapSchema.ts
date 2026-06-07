import { MapSchemaJson } from '../schemas/MapSchemaJson';
import { MapSchema } from '../../../domain/entities/schemas/MapSchema';
import { InferSchema } from '../InferSchema';

export type InferMapSchema<S extends MapSchemaJson> = MapSchema<
  unknown,
  InferSchema<S['additionalProperties']>
>;
