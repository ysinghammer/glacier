import type { InstanceCache } from '../interfaces/InstanceCache';
import type { InstanceFactory } from '../interfaces/InstanceFactory';

export class TransientCache<T> implements InstanceCache<T> {
  private readonly factory: InstanceFactory<T>;

  public constructor(factory: InstanceFactory<T>) {
    this.factory = factory;
  }

  public getInstance(): T {
    return this.factory.create();
  }
}
