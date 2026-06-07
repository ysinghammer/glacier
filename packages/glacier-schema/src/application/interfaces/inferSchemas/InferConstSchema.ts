import { ConstSchema } from '../../../domain/entities/schemas/ConstSchema';
import { ConstSchemaJson } from '../schemas/ConstSchemaJson';

export type InferConstSchema<S extends ConstSchemaJson> = ConstSchema<S['const']>;
