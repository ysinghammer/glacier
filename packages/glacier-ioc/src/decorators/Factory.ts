import { IOC_FACTORY } from '../reflection/IOC_FACTORY';
import { IOC_FACTORY_META } from '../reflection/IOC_FACTORY_META';

import type { ComponentMeta } from '../interfaces/ComponentMeta';

export function Factory(meta: ComponentMeta = {}): MethodDecorator {
  return (target, propertyKey) => {
    IOC_FACTORY.set(true, target, propertyKey);
    IOC_FACTORY_META.set(meta, target, propertyKey);
  };
}
