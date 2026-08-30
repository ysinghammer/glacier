import type { ISchemaMeta } from './ISchemaMeta.js';
import type { TSchemaLike } from '../TSchemaLike.js';

export interface IOneOfSchemaNode extends ISchemaMeta {
  readonly type?: undefined;
  readonly oneOf: readonly TSchemaLike[];
}
