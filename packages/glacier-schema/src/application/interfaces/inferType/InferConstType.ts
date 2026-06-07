import { ConstSchemaJson } from '../schemas/ConstSchemaJson';

export type InferConstType<T extends ConstSchemaJson> = T['const'];
