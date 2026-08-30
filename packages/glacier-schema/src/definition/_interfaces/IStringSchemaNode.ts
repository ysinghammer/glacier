import type { ISchemaMeta } from './ISchemaMeta.js';
import type { TFormat } from '../TFormat.js';

export interface IStringSchemaNode extends ISchemaMeta {
  readonly type: 'string';
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly format?: TFormat;
  readonly enum?: readonly string[];
  readonly const?: string;
}
