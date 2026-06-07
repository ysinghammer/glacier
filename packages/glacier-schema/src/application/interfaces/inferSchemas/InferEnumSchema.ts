import { EnumSchemaJson } from '../schemas/EnumSchemaJson';
import { EnumSchema } from '../../../domain/entities/schemas/EnumSchema';

export type InferEnumSchema<S extends EnumSchemaJson> = EnumSchema<S['enum']>;
