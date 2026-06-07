import { SetSchemaJson } from '../schemas/SetSchemaJson';
import { InferType } from '../InferType';

export type InferSetType<T extends SetSchemaJson> = InferType<T['items']>[];
