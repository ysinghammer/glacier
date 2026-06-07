import { globalContext } from '@glacier/context';

import type { InstanceCache } from '../interfaces/InstanceCache';
import type { InstanceFactory } from '../interfaces/InstanceFactory';

export class ScopedCache<T> implements InstanceCache<T> {
  private readonly factory: InstanceFactory<T>;
  private readonly instances = new Map<symbol | undefined, T>();

  public constructor(factory: InstanceFactory<T>) {
    this.factory = factory;
  }

  public getInstance(): T {
    const scope = globalContext.getContext();
    const instance = this.instances.get(scope);
    if (instance) {
      return instance;
    }
    const newInstance = this.factory.create();
    this.instances.set(scope, newInstance);
    return newInstance;
  }
}
