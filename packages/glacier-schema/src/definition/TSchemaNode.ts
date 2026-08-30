import type { IArraySchemaNode } from './_interfaces/IArraySchemaNode.js';
import type { IBooleanSchemaNode } from './_interfaces/IBooleanSchemaNode.js';
import type { IOneOfSchemaNode } from './_interfaces/IOneOfSchemaNode.js';
import type { INumberSchemaNode } from './_interfaces/INumberSchemaNode.js';
import type { IStringSchemaNode } from './_interfaces/IStringSchemaNode.js';
import type { TObjectSchemaNode } from './TObjectSchemaNode.js';

/** Every schema node shape `glacier-schema` supports. */
export type TSchemaNode =
  | IStringSchemaNode
  | INumberSchemaNode
  | IBooleanSchemaNode
  | TObjectSchemaNode
  | IArraySchemaNode
  | IOneOfSchemaNode;
