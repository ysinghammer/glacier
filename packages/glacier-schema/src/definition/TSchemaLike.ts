import type { Schema } from '../schema/Schema.js';
import type { TSchemaNode } from './TSchemaNode.js';

/** A schema node value: either a plain literal node, or an embedded `Schema` instance. */
export type TSchemaLike = TSchemaNode | Schema<TSchemaNode, unknown>;
