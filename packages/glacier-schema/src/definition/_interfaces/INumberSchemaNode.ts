import type { ISchemaMeta } from './ISchemaMeta.js';

export interface INumberSchemaNode extends ISchemaMeta {
  readonly type: 'number' | 'integer';
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: number;
  readonly exclusiveMaximum?: number;
  readonly multipleOf?: number;
  readonly enum?: readonly number[];
  readonly const?: number;
}
