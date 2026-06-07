import { DESIGN_RETURN_TYPE } from '@glacier/reflection';
import { isConstructor, getMethodNames } from '@glacier/utils';

import { ScopedCache } from './caches/ScopedCache';
import { SingletonCache } from './caches/SingletonCache';
import { TransientCache } from './caches/TransientCache';
import { InstanceNotRegistered } from './exceptions/InstanceNotRegistered';
import { MissingComponentDecorator } from './exceptions/MissingComponentDecorator';
import { MultipleImplementationsRegistered } from './exceptions/MultipleImplementationsRegistered';
import { ValueNotAConstructor } from './exceptions/ValueNotAConstructor';
import { CustomFactory } from './factories/CustomFactory';
import { DefaultFactory } from './factories/DefaultFactory';
import { Scope } from './interfaces/Scope';
import { IOC_COMPONENT } from './reflection/IOC_COMPONENT';
import { IOC_COMPONENT_META } from './reflection/IOC_COMPONENT_META';
import { IOC_FACTORY } from './reflection/IOC_FACTORY';
import { IOC_FACTORY_META } from './reflection/IOC_FACTORY_META';
import { IOC_MODULE } from './reflection/IOC_MODULE';
import { IOC_MODULE_META } from './reflection/IOC_MODULE_META';
import { CacheStore } from './util/CacheStore';

import type { InstanceFactory } from './interfaces/InstanceFactory';
import type { InstanceCache } from './interfaces/InstanceCache';
import type { AbstractConstructor, Constructor, Optional } from '@glacier/utils';

export class DIContainer {
  /**
   * Contains all assignments of component targets to a list of instance caches.
   * @private
   */
  private store = new CacheStore();

  /**
   * Registers a concrete implementation for a given target.
   * @param target The target, that can be used to resolve an instance of the implementation.
   * @param implementation The implementation that should be used to create an instance from.
   */
  public register<T>(
    target: AbstractConstructor<T>,
    implementation: Constructor<NoInfer<T>>
  ): this {
    this.assertComponent(implementation);
    this.registerDefaultFactory(target, implementation);
    const isModule = IOC_MODULE.has(target);
    if (isModule) {
      this.registerModule(implementation);
    }
    return this;
  }

  /**
   * Returns an instance of the given target or undefined if it is not registered.
   * @param target The target that should be resolved.
   */
  public resolve<T>(target: AbstractConstructor<T>): Optional<T> {
    const caches = this.store.getCaches<T>(target);
    if (caches.length === 0) {
      return;
    }
    if (caches.length > 1) {
      throw new MultipleImplementationsRegistered(target);
    }
    const cache = caches[0];
    return cache.getInstance();
  }

  /**
   * Returns an instance of the given target or throws if it is not registered.
   * @param target The target that should be resolved.
   */
  public resolveOrThrow<T>(target: AbstractConstructor<T>): T {
    const instance = this.resolve(target);
    if (!instance) {
      throw new InstanceNotRegistered(target);
    }
    return instance;
  }

  /**
   * Returns a list of instances for a given target.
   * @param target The target that should be resolved.
   */
  public resolveAll<T>(target: AbstractConstructor<T>): T[] {
    const caches = this.store.getCaches<T>(target);
    return caches.map((cache) => cache.getInstance());
  }

  /**
   * Registers a module including all factories and imported components.
   * @param implementation The actual implementing class.
   * @private
   */
  private registerModule(implementation: Constructor): void {
    this.registerModuleFactories(implementation);
    this.registerModuleImports(implementation);
  }

  /**
   * Registers all module factory functions.
   * @private
   */
  private registerModuleFactories(implementation: Constructor) {
    const methodNames = getMethodNames(implementation);
    for (const methodName of methodNames) {
      if (this.isFactory(implementation, methodName)) {
        this.registerModuleFactory(implementation, methodName);
      }
    }
  }

  private isFactory<M extends string>(
    implementation: Constructor,
    methodName: M
  ): implementation is Constructor<{ [K in M]: (container: DIContainer) => unknown }> {
    return IOC_FACTORY.has(implementation.prototype, methodName);
  }

  /**
   * Registers a single module factory.
   * @param implementation The actual implementing class.
   * @param methodName The method name of the factory.
   * @private
   */
  private registerModuleFactory<const M extends string>(
    implementation: Constructor<{ [P in M]: (container: DIContainer) => unknown }>,
    methodName: M
  ) {
    const factoryMeta = IOC_FACTORY_META.get(implementation.prototype, methodName);
    const factoryReturnType = DESIGN_RETURN_TYPE.get(implementation.prototype, methodName);
    this.assertConstructor(factoryReturnType);
    const customFactory = new CustomFactory(this, implementation, methodName);
    const scope = factoryMeta?.scope ?? Scope.SINGLETON;
    const cache = this.createCacheForScope(scope, customFactory);
    this.store.addCache(factoryReturnType, cache);

    if (factoryMeta?.implements) {
      for (const implementation of factoryMeta.implements) {
        this.store.addCache(implementation, cache);
      }
    }
  }

  /**
   * Registers all imported components.
   * @private
   */
  private registerModuleImports(implementation: Constructor) {
    const moduleMeta = IOC_MODULE_META.get(implementation);
    if (moduleMeta?.imports) {
      for (const target of moduleMeta.imports) {
        this.register(target, target);
      }
    }
  }

  /**
   * Registers a default factory for a given target and implementation class.
   * @param target The class that is used to resolve the implementation.
   * @param implementation The actual implementing class.
   * @private
   */
  private registerDefaultFactory(target: AbstractConstructor, implementation: Constructor): void {
    const componentMeta = IOC_COMPONENT_META.get(implementation);
    const factory = new DefaultFactory(this, implementation);
    const scope = componentMeta?.scope ?? Scope.SINGLETON;
    const cache = this.createCacheForScope(scope, factory);
    this.store.addCache(target, cache);
    this.store.addCache(implementation, cache);

    if (componentMeta?.implements) {
      for (const implementation of componentMeta.implements) {
        this.store.addCache(implementation, cache);
      }
    }
  }

  /**
   * Creates a cache instance for a given scope and factory.
   * @param scope The scope to create the cache for.
   * @param factory The factory to store inside the cache.
   * @private
   */
  private createCacheForScope<T>(scope: Scope, factory: InstanceFactory<T>): InstanceCache<T> {
    switch (scope) {
      case Scope.SINGLETON: {
        return new SingletonCache(factory);
      }
      case Scope.TRANSIENT: {
        return new TransientCache(factory);
      }
      case Scope.SCOPED: {
        return new ScopedCache(factory);
      }
    }
  }

  /**
   * Asserts, that a given class is a constructor.
   * @param cls The class to check for
   * @private
   */
  private assertConstructor(cls: unknown): asserts cls is Constructor {
    if (!isConstructor(cls)) {
      throw new ValueNotAConstructor(cls);
    }
  }

  /**
   * Asserts, that a given class is decorated with either the @Component
   * or @Module decorator.
   * @param cls The class to check for
   * @private
   */
  private assertComponent(cls: Constructor): void {
    const isComponent = IOC_COMPONENT.has(cls);
    if (!isComponent) {
      throw new MissingComponentDecorator(cls);
    }
  }
}
