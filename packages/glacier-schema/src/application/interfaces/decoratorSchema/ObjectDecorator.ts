import { Constructor } from '@glacier/utils';

import { BaseDecorator } from './BaseDecorator';

export interface ObjectDecorator extends BaseDecorator {
  type: Constructor;
}
