import type { ISchemaMeta } from './ISchemaMeta.js';
import type { TSchemaLike } from '../TSchemaLike.js';

export interface IArraySchemaNode extends ISchemaMeta {
  readonly type: 'array';
  readonly items?: TSchemaLike;
  readonly prefixItems?: readonly TSchemaLike[];
  readonly contains?: TSchemaLike;
  readonly minContains?: number;
  readonly maxContains?: number;
  readonly uniqueItems?: boolean;
}
