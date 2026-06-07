import '@glacier/reflection';
import { globalContext } from '@glacier/context';

import {
  Component,
  DIContainer,
  Factory,
  Module,
  Resolve,
  ResolveAll,
  ResolveOrThrow,
  Scope
} from '../src';

test('Scenario 1: should throw an error if a class is registered that is not decorated', () => {
  class A {}
  const container = new DIContainer();
  expect(() => {
    container.register(A, A);
  }).toThrow();
});

test('Scenario 2: should resolve a class by its constructor', () => {
  @Component()
  class A {}
  const container = new DIContainer();
  container.register(A, A);
  const instance = container.resolve(A);
  expect(instance).toBeInstanceOf(A);
});

test('Scenario 3: should return the same instance for every resolution by default', () => {
  @Component()
  class A {}
  const container = new DIContainer();
  container.register(A, A);
  const instanceA = container.resolve(A);
  const instanceB = container.resolve(A);
  expect(instanceA).toBe(instanceB);
});

test('Scenario 4: should return a new instance for every resolution when scope is TRANSIENT', () => {
  @Component({ scope: Scope.TRANSIENT })
  class A {}

  const container = new DIContainer();
  container.register(A, A);
  const instanceA = container.resolve(A);
  const instanceB = container.resolve(A);
  expect(instanceA).not.toBe(instanceB);
});

test('Scenario 5: should return undefined if given target is not registered', () => {
  class A {}
  const container = new DIContainer();
  const instance = container.resolve(A);
  expect(instance).toBeUndefined();
});

test('Scenario 6: should throw an error if given target is not registered', () => {
  class A {}

  const container = new DIContainer();
  expect(() => {
    container.resolveOrThrow(A);
  }).toThrow();
});

test('Scenario 7: should register imported components by a module', () => {
  @Component()
  class A {}

  @Component()
  class B {}

  @Module({
    imports: [A, B]
  })
  class M {}

  const container = new DIContainer();
  container.register(M, M);
  expect(container.resolve(A)).toBeInstanceOf(A);
  expect(container.resolve(B)).toBeInstanceOf(B);
  expect(container.resolve(M)).toBeInstanceOf(M);
});

test('Scenario 8: should register interfaces created by a factory', () => {
  class B {}

  class A {}

  @Module()
  class M {
    @Factory({ implements: [B] })
    public createA(): A {
      return new A();
    }
  }

  const container = new DIContainer();
  container.register(M, M);
  expect(container.resolve(B)).toBeInstanceOf(A);
});

test('Scenario 9: should register components created by a factory', () => {
  class A {}

  @Module()
  class M {
    @Factory()
    public createA(): A {
      return new A();
    }
  }

  const container = new DIContainer();
  container.register(M, M);
  expect(container.resolve(A)).toBeInstanceOf(A);
});

test('Scenario 10: should ignore module methods that are not decorated with @Factory', () => {
  class A {}
  class B {}

  @Module()
  class M {
    @Factory()
    public createA(): A {
      return new A();
    }

    public createB(): B {
      return new B();
    }
  }

  const container = new DIContainer();
  container.register(M, M);
  expect(container.resolve(B)).toBeUndefined();
});

test('Scenario 11: should call factory function once for a singleton scope', () => {
  class A {}

  @Module()
  class M {
    @Factory({ scope: Scope.SINGLETON })
    public createA(): A {
      return new A();
    }
  }

  const container = new DIContainer();
  const spy = jest.spyOn(M.prototype, 'createA');
  expect(spy).toHaveBeenCalledTimes(0);
  container.register(M, M);
  expect(spy).toHaveBeenCalledTimes(1);
  expect(container.resolve(A)).toBeInstanceOf(A);
  expect(spy).toHaveBeenCalledTimes(1);
});

test('Scenario 12: should call factory function multiple times for a transient scope', () => {
  class A {}

  @Module()
  class M {
    @Factory({ scope: Scope.TRANSIENT })
    public createA(): A {
      return new A();
    }
  }

  const container = new DIContainer();
  const spy = jest.spyOn(M.prototype, 'createA');
  expect(spy).toHaveBeenCalledTimes(0);
  container.register(M, M);
  expect(spy).toHaveBeenCalledTimes(0);
  expect(container.resolve(A)).toBeInstanceOf(A);
  expect(spy).toHaveBeenCalledTimes(1);
  expect(container.resolve(A)).toBeInstanceOf(A);
  expect(spy).toHaveBeenCalledTimes(2);
});

test('Scenario 13: should return a new instance for every new request scope when scope is SCOPED', () => {
  @Component({ scope: Scope.SCOPED })
  class A {}

  const container = new DIContainer();
  container.register(A, A);
  const instanceA = container.resolve(A);
  expect(instanceA).toBeInstanceOf(A);
  expect(container.resolve(A)).toBe(instanceA);

  function scopeA() {
    const instanceB = container.resolve(A);
    expect(instanceB).toBeInstanceOf(A);
    expect(instanceA).not.toBe(instanceB);
    expect(container.resolve(A)).toBe(instanceB);
  }

  function scopeB() {
    const instanceC = container.resolve(A);
    expect(instanceC).toBeInstanceOf(A);
    expect(instanceA).not.toBe(instanceC);
    expect(container.resolve(A)).toBe(instanceC);
  }

  globalContext.run(scopeA);
  globalContext.run(scopeB);
});

test('Scenario 14: should resolve a list of instances', () => {
  abstract class I {}

  @Component()
  class A {}

  @Component()
  class B {}

  const container = new DIContainer();
  container.register(I, A);
  container.register(I, B);

  const instance = container.resolveAll(I);
  expect(instance).toEqual([expect.any(A), expect.any(B)]);
});

test('Scenario 15: should throw an error if multiple instances are defined', () => {
  abstract class I {}

  @Component()
  class A {}

  @Component()
  class B {}

  const container = new DIContainer();
  container.register(I, A);
  container.register(I, B);

  expect(() => {
    container.resolve(I);
  }).toThrow();
});

test('Scenario 16: should return a new instance for every new request scope when scope is SCOPED and created by a factory', () => {
  class A {}

  @Module()
  class M {
    @Factory({ scope: Scope.SCOPED })
    public createA(): A {
      return new A();
    }
  }

  const container = new DIContainer();
  container.register(M, M);

  const instanceA = container.resolve(A);
  expect(instanceA).toBeInstanceOf(A);
  expect(container.resolve(A)).toBe(instanceA);

  function scopeA() {
    const instanceB = container.resolve(A);
    expect(instanceB).toBeInstanceOf(A);
    expect(instanceA).not.toBe(instanceB);
    expect(container.resolve(A)).toBe(instanceB);
  }

  function scopeB() {
    const instanceC = container.resolve(A);
    expect(instanceC).toBeInstanceOf(A);
    expect(instanceA).not.toBe(instanceC);
    expect(container.resolve(A)).toBe(instanceC);
  }

  globalContext.run(scopeA);
  globalContext.run(scopeB);
});

test('Scenario 17: should throw an error if factory returns primitive value', () => {
  @Module()
  class M {
    @Factory()
    public createA(): string {
      return '';
    }
  }

  const container = new DIContainer();
  expect(() => {
    container.register(M, M);
  }).toThrow();
});

test('Scenario 18: should resolve a constructor parameter', () => {
  @Component()
  class A {}

  const spy = jest.fn();

  @Component()
  class B {
    public constructor(a: A) {
      spy(a);
    }
  }

  const container = new DIContainer();
  container.register(A, A);
  container.register(B, B);
  expect(spy).toHaveBeenCalledWith(expect.any(A));
});

test('Scenario 19: should throw an error if constructor parameter is not registered', () => {
  @Component()
  class A {}

  const spy = jest.fn();

  @Component()
  class B {
    public constructor(a: A) {
      spy(a);
    }
  }

  const container = new DIContainer();

  expect(() => {
    container.register(B, B);
  }).toThrow();
});

test('Scenario 20: should resolve constructor parameter with undefined if @Resolve is used', () => {
  @Component()
  class A {}

  const spy = jest.fn();

  @Component()
  class B {
    public constructor(@Resolve(A) a?: A) {
      spy(a);
    }
  }

  const container = new DIContainer();
  container.register(B, B);
  expect(spy).toHaveBeenCalledWith(undefined);
});

test('Scenario 21: should resolve constructor parameter if @Resolve is used', () => {
  @Component()
  class A {}

  const spy = jest.fn();

  @Component()
  class B {
    public constructor(@Resolve(A) a: A) {
      spy(a);
    }
  }

  const container = new DIContainer();
  container.register(A, A);
  container.register(B, B);
  expect(spy).toHaveBeenCalledWith(expect.any(A));
});

test('Scenario 22: should resolve constructor parameter if @ResolveOrThrow is used', () => {
  @Component()
  class A {}

  const spy = jest.fn();

  @Component()
  class B {
    public constructor(@ResolveOrThrow(A) a: A) {
      spy(a);
    }
  }

  const container = new DIContainer();
  container.register(A, A);
  container.register(B, B);
  expect(spy).toHaveBeenCalledWith(expect.any(A));
});

test('Scenario 23: should throw an error if constructor parameter is not registered and @ResolveOrThrow is used', () => {
  @Component()
  class A {}

  const spy = jest.fn();

  @Component()
  class B {
    public constructor(@ResolveOrThrow(A) a: A) {
      spy(a);
    }
  }

  const container = new DIContainer();
  expect(() => {
    container.register(B, B);
  }).toThrow();
});

test('Scenario 24: should resolve a constructor parameter with an array if @ResolveAll is used', () => {
  abstract class I {}

  @Component()
  class I1 extends I {}

  @Component()
  class I2 extends I {}

  const spy = jest.fn();

  @Component()
  class B {
    public constructor(@ResolveAll(I) i: I[]) {
      spy(i);
    }
  }

  const container = new DIContainer();
  container.register(I, I1);
  container.register(I, I2);
  container.register(B, B);
  expect(spy).toHaveBeenCalledWith(expect.arrayContaining([expect.any(I), expect.any(I)]));
});

test('Scenario 25: should throw an error if constructor parameter is a primitive value', () => {
  @Component()
  class B {
    public constructor(private readonly name: string) {}
  }

  const container = new DIContainer();
  expect(() => {
    container.register(B, B);
  }).toThrow();
});

test('Scenario 26: should resolve all instances that implements a given class', () => {
  abstract class A {}

  @Component({ implements: [A] })
  class B {}

  const container = new DIContainer();
  container.register(B, B);
  expect(container.resolve(A)).toBeInstanceOf(B);
  expect(container.resolveAll(A)).toEqual([expect.any(B)]);
});
