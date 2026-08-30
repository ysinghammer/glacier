import type { ISchemaMeta } from './ISchemaMeta.js';
import type { IStringSchemaNode } from './IStringSchemaNode.js';
import type { TSchemaLike } from '../TSchemaLike.js';

/** An open object, typed as an index signature. */
export interface IOpenObjectSchemaNode extends ISchemaMeta {
  readonly type: 'object';
  readonly properties?: undefined;
  readonly additionalProperties?: TSchemaLike | true;
  readonly propertyNames?: IStringSchemaNode;
}
