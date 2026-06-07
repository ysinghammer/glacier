import { Component } from './Component';
import { Scope } from '../interfaces/Scope';
import { IOC_MODULE } from '../reflection/IOC_MODULE';
import { IOC_MODULE_META } from '../reflection/IOC_MODULE_META';

import type { ModuleMeta } from '../interfaces/ModuleMeta';

export function Module(meta: ModuleMeta = {}): ClassDecorator {
  return (target) => {
    IOC_MODULE.set(true, target);
    IOC_MODULE_META.set(meta, target);
    Component({ scope: Scope.SINGLETON, implements: meta.implements })(target);
  };
}
