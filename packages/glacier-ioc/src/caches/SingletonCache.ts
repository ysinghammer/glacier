import type { InstanceCache } from '../interfaces/InstanceCache';
import type { InstanceFactory } from '../interfaces/InstanceFactory';

export class SingletonCache<T> implements InstanceCache<T> {
  private readonly instance: T;

  public constructor(factory: InstanceFactory<T>) {
    this.instance = factory.create();
  }

  public getInstance(): T {
    return this.instance;
  }
}
