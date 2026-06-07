import { EnumSchemaJson } from '../schemas/EnumSchemaJson';

export type InferEnumType<T extends EnumSchemaJson> = T['enum'][number];
