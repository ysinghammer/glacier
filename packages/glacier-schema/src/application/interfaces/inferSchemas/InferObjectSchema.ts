import { ObjectSchema } from '../../../domain/entities/schemas/ObjectSchema';
import { ObjectSchemaJson } from '../schemas/ObjectSchemaJson';
import { InferSchema } from '../InferSchema';

export type InferObjectSchema<S extends ObjectSchemaJson> = ObjectSchema<
  {
    [K in keyof S['properties']]: InferSchema<S['properties'][K]>;
  },
  S['required']
>;
