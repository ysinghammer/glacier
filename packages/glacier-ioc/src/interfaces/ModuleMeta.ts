import type { Constructor } from '@glacier/utils';
import type { ComponentMeta } from './ComponentMeta';

export interface ModuleMeta extends Omit<ComponentMeta, 'scope'> {
  imports?: Constructor[];
}
