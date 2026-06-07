import type { Constructor } from '@glacier/utils';
import type { DIContainer } from '../DIContainer';
import type { InstanceFactory } from '../interfaces/InstanceFactory';

export class CustomFactory<T, M extends string> implements InstanceFactory<T> {
  private readonly container: DIContainer;
  private readonly cls: Constructor<{ [P in M]: (container: DIContainer) => T }>;
  private readonly method: M;

  public constructor(
    container: DIContainer,
    cls: Constructor<{ [P in M]: (container: DIContainer) => T }>,
    method: M
  ) {
    this.container = container;
    this.cls = cls;
    this.method = method;
  }

  public create(): T {
    const instance = this.container.resolveOrThrow(this.cls);
    return instance[this.method](this.container);
  }
}
