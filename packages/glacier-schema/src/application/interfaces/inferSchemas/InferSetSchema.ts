import { SetSchemaJson } from '../schemas/SetSchemaJson';
import { SetSchema } from '../../../domain/entities/schemas/SetSchema';
import { InferSchema } from '../InferSchema';

export type InferSetSchema<S extends SetSchemaJson> = SetSchema<unknown, InferSchema<S['items']>>;
