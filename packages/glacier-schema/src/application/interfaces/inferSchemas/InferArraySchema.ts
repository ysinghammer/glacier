import { ArraySchema } from '../../../domain/entities/schemas/ArraySchema';
import { InferSchema } from '../InferSchema';
import { ArraySchemaJson } from '../schemas/ArraySchemaJson';

export type InferArraySchema<S extends ArraySchemaJson> = ArraySchema<
  unknown,
  InferSchema<S['items']>
>;
