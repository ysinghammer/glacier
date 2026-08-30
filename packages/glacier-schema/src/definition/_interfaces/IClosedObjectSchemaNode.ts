import type { ISchemaMeta } from './ISchemaMeta.js';
import type { IStringSchemaNode } from './IStringSchemaNode.js';
import type { TSchemaLike } from '../TSchemaLike.js';

/** A closed/exact object: only the listed `properties` are allowed. */
export interface IClosedObjectSchemaNode extends ISchemaMeta {
  readonly type: 'object';
  readonly properties: Record<string, TSchemaLike>;
  readonly required?: readonly string[];
  readonly additionalProperties?: false;
  readonly propertyNames?: IStringSchemaNode;
}
