import type { AbstractConstructor } from '@glacier/utils';
import type { Scope } from './Scope';

export interface ComponentMeta {
  scope?: Scope;
  implements?: AbstractConstructor[];
}
