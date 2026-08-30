import type { ISchemaMeta } from './ISchemaMeta.js';

export interface IBooleanSchemaNode extends ISchemaMeta {
  readonly type: 'boolean';
  readonly enum?: readonly boolean[];
  readonly const?: boolean;
}
