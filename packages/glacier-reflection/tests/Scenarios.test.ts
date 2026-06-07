import {
  DESIGN_PARAM_TYPES,
  DESIGN_RETURN_TYPE,
  DESIGN_TYPE,
  ReadonlyReflection,
  reflect,
  Reflection,
  ReflectionMap,
  ReflectionSet
} from '../src';
import { fakeClass } from './fakes/fakeClass';
import { fakeClassInheritance } from './fakes/fakeClassInheritance';
import { fakeMethodDecorator } from './fakes/fakeMethodDecorator';
import { fakePropertyDecorator } from './fakes/fakePropertyDecorator';

describe('Scenarios @glacier/reflection', () => {
  test('Scenario 0: Overrides the global Reflect object to provide a custom implementation', () => {
    expect(typeof Reflect.metadata).toBe('function');
  });

  test('Scenario 1: Define metadata on a class and retrieve it', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('key', '{{VALUE}}', classFake);
    const metadataValue = reflect.getMetadata('key', classFake);
    expect(metadataValue).toBe('{{VALUE}}');
  });

  test('Scenario 2: Define metadata on a class property and retrieve it', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('key', '{{VALUE}}', classFake, 'fakeProperty');
    const metadataValue = reflect.getMetadata('key', classFake, 'fakeProperty');
    expect(metadataValue).toBe('{{VALUE}}');
  });

  test('Scenario 3: Define metadata on a class method and retrieve it', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('key', '{{VALUE}}', classFake, 'fakeMethod');
    const metadataValue = reflect.getMetadata('key', classFake, 'fakeMethod');
    expect(metadataValue).toBe('{{VALUE}}');
  });

  test('Scenario 4: Define metadata on a classes parent and retrieve it on the child', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE}}', baseClass);
    const metadataValue = reflect.getMetadata('key', inheritedClass);
    expect(metadataValue).toBe('{{VALUE}}');
  });

  test('Scenario 5: Define metadata on a classes parent property and retrieve it on the child', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE}}', baseClass, 'fakeProperty');
    const metadataValue = reflect.getMetadata('key', inheritedClass, 'fakeProperty');
    expect(metadataValue).toBe('{{VALUE}}');
  });

  test('Scenario 6: Define metadata on a classes parent method and retrieve it on the child', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE}}', baseClass, 'fakeMethod');
    const metadataValue = reflect.getMetadata('key', inheritedClass, 'fakeMethod');
    expect(metadataValue).toBe('{{VALUE}}');
  });

  test('Scenario 7: Override metadata on a parent class', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE_BASE}}', baseClass);
    reflect.defineMetadata('key', '{{VALUE_INHERITED}}', inheritedClass);
    const baseMetadataValue = reflect.getMetadata('key', baseClass);
    const inheritedMetadataValue = reflect.getMetadata('key', inheritedClass);
    expect(baseMetadataValue).toBe('{{VALUE_BASE}}');
    expect(inheritedMetadataValue).toBe('{{VALUE_INHERITED}}');
  });

  test('Scenario 8: Override metadata on a parent class property', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE_BASE}}', baseClass, 'fakeProperty');
    reflect.defineMetadata('key', '{{VALUE_INHERITED}}', inheritedClass, 'fakeProperty');
    const baseMetadataValue = reflect.getMetadata('key', baseClass, 'fakeProperty');
    const inheritedMetadataValue = reflect.getMetadata('key', inheritedClass, 'fakeProperty');
    expect(baseMetadataValue).toBe('{{VALUE_BASE}}');
    expect(inheritedMetadataValue).toBe('{{VALUE_INHERITED}}');
  });

  test('Scenario 9: Override metadata on a parent class method', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE_BASE}}', baseClass, 'fakeMethod');
    reflect.defineMetadata('key', '{{VALUE_INHERITED}}', inheritedClass, 'fakeMethod');
    const baseMetadataValue = reflect.getMetadata('key', baseClass, 'fakeMethod');
    const inheritedMetadataValue = reflect.getMetadata('key', inheritedClass, 'fakeMethod');
    expect(baseMetadataValue).toBe('{{VALUE_BASE}}');
    expect(inheritedMetadataValue).toBe('{{VALUE_INHERITED}}');
  });

  test('Scenario 10: Retrieve only the owen metadata of a class', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE}}', baseClass);
    const metadataValue = reflect.getOwnMetadata('key', inheritedClass);
    expect(metadataValue).toBeUndefined();
  });

  test('Scenario 11: Retrieve only the owen metadata of a classes property', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE}}', baseClass, 'fakeProperty');
    const metadataValue = reflect.getOwnMetadata('key', inheritedClass, 'fakeProperty');
    expect(metadataValue).toBeUndefined();
  });

  test('Scenario 12: Retrieve only the owen metadata of a classes method', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE}}', baseClass, 'fakeMethod');
    const metadataValue = reflect.getOwnMetadata('key', inheritedClass, 'fakeMethod');
    expect(metadataValue).toBeUndefined();
  });

  test('Scenario 13: Delete metadata from a class', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('key', '{{VALUE}}', classFake);
    const deleteResult = reflect.deleteMetadata('key', classFake);
    const metadataValue = reflect.getMetadata('key', classFake);
    expect(deleteResult).toBe(true);
    expect(metadataValue).toBeUndefined();
  });

  test('Scenario 14: Delete metadata from a classes property', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('key', '{{VALUE}}', classFake, 'fakeProperty');
    const deleteResult = reflect.deleteMetadata('key', classFake, 'fakeProperty');
    const metadataValue = reflect.getMetadata('key', classFake, 'fakeProperty');
    expect(deleteResult).toBe(true);
    expect(metadataValue).toBeUndefined();
  });

  test('Scenario 15: Delete metadata from a classes method', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('key', '{{VALUE}}', classFake, 'fakeMethod');
    const deleteResult = reflect.deleteMetadata('key', classFake, 'fakeMethod');
    const metadataValue = reflect.getMetadata('key', classFake, 'fakeMethod');
    expect(deleteResult).toBe(true);
    expect(metadataValue).toBeUndefined();
  });

  test('Scenario 16: Get parent metadata after own metadata has been deleted', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE_BASE}}', baseClass);
    reflect.defineMetadata('key', '{{VALUE_INHERITED}}', inheritedClass);
    expect(reflect.getMetadata('key', inheritedClass)).toBe('{{VALUE_INHERITED}}');
    reflect.deleteMetadata('key', inheritedClass);
    expect(reflect.getMetadata('key', inheritedClass)).toBe('{{VALUE_BASE}}');
  });

  test('Scenario 17: Get parent metadata after own metadata has been deleted for property', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE_BASE}}', baseClass, 'fakeProperty');
    reflect.defineMetadata('key', '{{VALUE_INHERITED}}', inheritedClass, 'fakeProperty');
    expect(reflect.getMetadata('key', inheritedClass, 'fakeProperty')).toBe('{{VALUE_INHERITED}}');
    reflect.deleteMetadata('key', inheritedClass, 'fakeProperty');
    expect(reflect.getMetadata('key', inheritedClass, 'fakeProperty')).toBe('{{VALUE_BASE}}');
  });

  test('Scenario 18: Get metadata keys defined on a class', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('key1', '{{VALUE1}}', classFake);
    reflect.defineMetadata('key2', '{{VALUE2}}', classFake);
    const metadataKeys = reflect.getMetadataKeys(classFake);
    expect(metadataKeys).toContain('key1');
    expect(metadataKeys).toContain('key2');
  });

  test('Scenario 19: Get metadata keys defined on a classes property', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('key1', '{{VALUE1}}', classFake, 'fakeProperty');
    reflect.defineMetadata('key2', '{{VALUE2}}', classFake, 'fakeProperty');
    const metadataKeys = reflect.getMetadataKeys(classFake, 'fakeProperty');
    expect(metadataKeys).toContain('key1');
    expect(metadataKeys).toContain('key2');
  });

  test('Scenario 20: Get metadata keys defined on a class and its parent', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key1', '{{VALUE1}}', baseClass);
    reflect.defineMetadata('key2', '{{VALUE2}}', inheritedClass);
    const metadataKeys = reflect.getMetadataKeys(inheritedClass);
    expect(metadataKeys).toContain('key1');
    expect(metadataKeys).toContain('key2');
  });

  test('Scenario 21: Get metadata keys defined on a class and its parent property', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key1', '{{VALUE1}}', baseClass, 'fakeProperty');
    reflect.defineMetadata('key2', '{{VALUE2}}', inheritedClass, 'fakeProperty');
    const metadataKeys = reflect.getMetadataKeys(inheritedClass, 'fakeProperty');
    expect(metadataKeys).toContain('key1');
    expect(metadataKeys).toContain('key2');
  });

  test('Scenario 22: Get metadata keys only defined on the own class', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key1', '{{VALUE1}}', baseClass);
    reflect.defineMetadata('key2', '{{VALUE2}}', inheritedClass);
    const metadataKeys = reflect.getOwnMetadataKeys(inheritedClass);
    expect(metadataKeys).not.toContain('key1');
    expect(metadataKeys).toContain('key2');
  });

  test('Scenario 23: Get metadata keys only defined on the own class property', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key1', '{{VALUE1}}', baseClass, 'fakeProperty');
    reflect.defineMetadata('key2', '{{VALUE2}}', inheritedClass, 'fakeProperty');
    const metadataKeys = reflect.getOwnMetadataKeys(inheritedClass, 'fakeProperty');
    expect(metadataKeys).not.toContain('key1');
    expect(metadataKeys).toContain('key2');
  });

  test('Scenario 24: Check if a metadataKey exists on a class', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('key', '{{VALUE}}', classFake);
    const hasKey = reflect.hasMetadata('key', classFake);
    expect(hasKey).toBe(true);
  });

  test('Scenario 25: Check if a metadataKey exists on a classes property', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('key', '{{VALUE}}', classFake, 'fakeProperty');
    const hasKey = reflect.hasMetadata('key', classFake, 'fakeProperty');
    expect(hasKey).toBe(true);
  });

  test('Scenario 26: Check if a metadataKey exists on a class inherited from parent', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE}}', baseClass);
    const hasKey = reflect.hasMetadata('key', inheritedClass);
    expect(hasKey).toBe(true);
  });

  test('Scenario 27: Check if a metadataKey exists on a class property inherited from parent', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE}}', baseClass, 'fakeProperty');
    const hasKey = reflect.hasMetadata('key', inheritedClass, 'fakeProperty');
    expect(hasKey).toBe(true);
  });

  test('Scenario 28: Check if an own metadataKey exists on a class', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE}}', baseClass);
    const hasKey = reflect.hasOwnMetadata('key', inheritedClass);
    expect(hasKey).toBe(false);
  });

  test('Scenario 29: Check if an own metadataKey exists on a class property', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('key', '{{VALUE}}', baseClass, 'fakeProperty');
    const hasKey = reflect.hasOwnMetadata('key', inheritedClass, 'fakeProperty');
    expect(hasKey).toBe(false);
  });

  test('Scenario 30: Check if metadataKey does not exist on any inheritance level', () => {
    const { inheritedClass } = fakeClassInheritance();
    const hasKey = reflect.hasMetadata('key', inheritedClass, 'fakeProperty');
    expect(hasKey).toBe(false);
  });

  test('Scenario 31: Using decorator on a class defines metadata correctly', () => {
    @reflect.metadata('key', '{{VALUE}}')
    class Target {
      declare public fakeProperty: string;
    }
    expect(reflect.getMetadata('key', Target)).toBe('{{VALUE}}');
  });

  test('Scenario 32: Using decorator on a class property defines metadata correctly', () => {
    class Target {
      @reflect.metadata('key', '{{VALUE}}')
      declare public fakeProperty: string;
    }
    expect(reflect.getMetadata('key', Target.prototype, 'fakeProperty')).toBe('{{VALUE}}');
  });

  test('Scenario 33: Using decorator on a class method defines metadata correctly', () => {
    class Target {
      @reflect.metadata('key', '{{VALUE}}')
      public fakeMethod(): void {}
    }
    expect(reflect.getMetadata('key', Target.prototype, 'fakeMethod')).toBe('{{VALUE}}');
  });

  test('Scenario 34: Custom class decorator are correctly called', () => {
    const classDecorator = jest.fn();

    @classDecorator
    class Target {
      declare public fakeProperty: string;
    }

    expect(classDecorator).toHaveBeenCalledWith(Target);
  });

  test('Scenario 35: Custom class decorator with parameter are correctly called', () => {
    const classDecorator = jest.fn();
    const classDecoratorFactory = () => classDecorator;

    @classDecoratorFactory()
    class Target {
      declare public fakeProperty: string;
    }

    expect(classDecorator).toHaveBeenCalledWith(Target);
  });

  test('Scenario 36: Custom property decorator are correctly called', () => {
    const propertyDecorator = jest.fn();

    class Target {
      @propertyDecorator
      public fakeProperty: string = 'a';
    }

    expect(propertyDecorator).toHaveBeenCalledWith(Target.prototype, 'fakeProperty', undefined);
  });

  test('Scenario 37: Custom property decorator factories are correctly called', () => {
    const propertyDecorator = jest.fn();
    const propertyDecoratorFactory = () => propertyDecorator;

    class Target {
      @propertyDecoratorFactory()
      public fakeProperty: string = 'a';
    }

    expect(propertyDecorator).toHaveBeenCalledWith(Target.prototype, 'fakeProperty', undefined);
  });

  test('Scenario 38: Custom method decorator are correctly called', () => {
    const methodDecorator = jest.fn();

    class Target {
      @methodDecorator
      public fakeMethod(): void {}
    }

    expect(methodDecorator).toHaveBeenCalledWith(
      Target.prototype,
      'fakeMethod',
      Object.getOwnPropertyDescriptor(Target.prototype, 'fakeMethod')
    );
  });

  test('Scenario 39: Custom method decorator factory are correctly called', () => {
    const methodDecorator = jest.fn();
    const methodDecoratorFactory = () => methodDecorator;

    class Target {
      @methodDecoratorFactory()
      public fakeMethod(): void {}
    }

    expect(methodDecorator).toHaveBeenCalledWith(
      Target.prototype,
      'fakeMethod',
      Object.getOwnPropertyDescriptor(Target.prototype, 'fakeMethod')
    );
  });

  test('Scenario 40: Custom parameter decorator are correctly called', () => {
    const parameterDecorator = jest.fn();

    class Target {
      public fakeMethod(@parameterDecorator a: string): string {
        return a;
      }
    }

    expect(parameterDecorator).toHaveBeenCalledWith(Target.prototype, 'fakeMethod', 0);
  });

  test('Scenario 41: Custom parameter decorator are correctly called', () => {
    const parameterDecorator = jest.fn();
    const parameterDecoratorFactory = () => parameterDecorator;

    class Target {
      public fakeMethod(@parameterDecoratorFactory() a: string): string {
        return a;
      }
    }

    expect(parameterDecorator).toHaveBeenCalledWith(Target.prototype, 'fakeMethod', 0);
  });

  test('Scenario 42: Returns all propertyKeys of a target', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('test', 'value', classFake, 'fakeProperty1');
    reflect.defineMetadata('test', 'value', classFake, 'fakeProperty2');
    const getPropertyKeys = reflect.getPropertyKeys(classFake);
    expect(getPropertyKeys).toContain('fakeProperty1');
    expect(getPropertyKeys).toContain('fakeProperty2');
  });

  test('Scenario 43: Returns all inherited propertyKeys of a target', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('test', 'value', inheritedClass, 'fakeProperty1');
    reflect.defineMetadata('test', 'value', baseClass, 'fakeProperty2');
    const getPropertyKeys = reflect.getPropertyKeys(inheritedClass);
    expect(getPropertyKeys).toContain('fakeProperty1');
    expect(getPropertyKeys).toContain('fakeProperty2');
  });

  test('Scenario 44: Returns only own propertyKeys event if inherited propertyKeys exist', () => {
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('test', 'value', inheritedClass, 'fakeProperty1');
    reflect.defineMetadata('test', 'value', baseClass, 'fakeProperty2');
    const getPropertyKeys = reflect.getOwnPropertyKeys(inheritedClass);
    expect(getPropertyKeys).toContain('fakeProperty1');
    expect(getPropertyKeys).not.toContain('fakeProperty2');
  });

  test('Scenario 45: Return false from deleteMetadata if metadata target does not exist', () => {
    const classFake = fakeClass();
    expect(reflect.deleteMetadata('t', classFake, 'x')).toBe(false);
  });

  test('Scenario 46: Return false from deleteMetadata if propertyKey does not exist', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('x', 'y', classFake);
    expect(reflect.deleteMetadata('t', classFake, 'x')).toBe(false);
  });

  test('Scenario 47: Return false from deleteMetadata if metadataKey does not exist', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('x', 'y', classFake, 'x');
    expect(reflect.deleteMetadata('t', classFake, 'x')).toBe(false);
  });

  test('Scenario 48: Keep other metadata on same propertyKey', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('1', 'y', classFake, '1');
    reflect.defineMetadata('2', 'y', classFake, '1');

    expect(reflect.deleteMetadata('1', classFake, '1')).toBe(true);
    expect(reflect.getMetadata('2', classFake, '1')).toBe('y');
  });

  test('Scenario 49: Keep other metadata on same target', () => {
    const classFake = fakeClass();
    reflect.defineMetadata('1', 'y', classFake, '1');
    reflect.defineMetadata('2', 'y', classFake, '2');

    expect(reflect.deleteMetadata('1', classFake, '1')).toBe(true);
    expect(reflect.getMetadata('2', classFake, '2')).toBe('y');
  });

  test('Scenario 50: DESIGN_PARAM_TYPES returns the parameter of a method', () => {
    const Decorator = fakeMethodDecorator();
    class Test {
      @Decorator
      public test(a: string, b: number) {
        return [a, b];
      }
    }
    const paramTypes = DESIGN_PARAM_TYPES.get(Test.prototype, 'test');
    expect(paramTypes).toEqual([String, Number]);
  });

  test('Scenario 51: DESIGN_RETURN_TYPE returns return type of a method', () => {
    const Decorator = fakeMethodDecorator();
    class Test {
      @Decorator
      public test(): string {
        return 'X';
      }
    }
    const paramTypes = DESIGN_RETURN_TYPE.get(Test.prototype, 'test');
    expect(paramTypes).toEqual(String);
  });

  test('Scenario 52: DESIGN_TYPE returns the type of a property', () => {
    const Decorator = fakePropertyDecorator();
    class Test {
      @Decorator
      declare public age: number;
    }
    const paramTypes = DESIGN_TYPE.get(Test.prototype, 'age');
    expect(paramTypes).toEqual(Number);
  });

  test('Scenario 53: ReadonlyReflection get returns metadata value', () => {
    const readonly = new ReadonlyReflection<string>('test-key');
    const classFake = fakeClass();
    reflect.defineMetadata('test-key', 'test-value', classFake);
    expect(readonly.get(classFake)).toBe('test-value');
  });

  test('Scenario 54: ReadonlyReflection get returns metadata value with propertyKey', () => {
    const readonly = new ReadonlyReflection<string>('test-key');
    const classFake = fakeClass();
    reflect.defineMetadata('test-key', 'test-value', classFake, 'fakeProperty');
    expect(readonly.get(classFake, 'fakeProperty')).toBe('test-value');
  });

  test('Scenario 55: ReadonlyReflection has returns true when metadata exists', () => {
    const readonly = new ReadonlyReflection<string>('test-key');
    const classFake = fakeClass();
    reflect.defineMetadata('test-key', 'test-value', classFake);
    expect(readonly.has(classFake)).toBe(true);
  });

  test('Scenario 56: ReadonlyReflection has returns false when metadata does not exist', () => {
    const readonly = new ReadonlyReflection<string>('test-key');
    const classFake = fakeClass();
    expect(readonly.has(classFake)).toBe(false);
  });

  test('Scenario 57: ReadonlyReflection getOwn returns own metadata value', () => {
    const readonly = new ReadonlyReflection<string>('test-key');
    const classFake = fakeClass();
    reflect.defineMetadata('test-key', 'test-value', classFake);
    expect(readonly.getOwn(classFake)).toBe('test-value');
  });

  test('Scenario 58: ReadonlyReflection getOwn returns undefined for inherited metadata', () => {
    const readonly = new ReadonlyReflection<string>('test-key');
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('test-key', 'test-value', baseClass);
    expect(readonly.getOwn(inheritedClass)).toBeUndefined();
  });

  test('Scenario 59: ReadonlyReflection hasOwn returns true for own metadata', () => {
    const readonly = new ReadonlyReflection<string>('test-key');
    const classFake = fakeClass();
    reflect.defineMetadata('test-key', 'test-value', classFake);
    expect(readonly.hasOwn(classFake)).toBe(true);
  });

  test('Scenario 60: ReadonlyReflection hasOwn returns false for inherited metadata', () => {
    const readonly = new ReadonlyReflection<string>('test-key');
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflect.defineMetadata('test-key', 'test-value', baseClass);
    expect(readonly.hasOwn(inheritedClass)).toBe(false);
  });

  test('Scenario 61: Reflection set defines metadata on target', () => {
    const reflection = new Reflection<string>('test-key');
    const classFake = fakeClass();
    reflection.set('test-value', classFake);
    expect(reflect.getMetadata('test-key', classFake)).toBe('test-value');
  });

  test('Scenario 62: Reflection set defines metadata on target with propertyKey', () => {
    const reflection = new Reflection<string>('test-key');
    const classFake = fakeClass();
    reflection.set('test-value', classFake, 'fakeProperty');
    expect(reflect.getMetadata('test-key', classFake, 'fakeProperty')).toBe('test-value');
  });

  test('Scenario 63: Reflection delete removes metadata from target', () => {
    const reflection = new Reflection<string>('test-key');
    const classFake = fakeClass();
    reflection.set('test-value', classFake);
    expect(reflection.delete(classFake)).toBe(true);
    expect(reflect.getMetadata('test-key', classFake)).toBeUndefined();
  });

  test('Scenario 64: Reflection delete returns false when metadata does not exist', () => {
    const reflection = new Reflection<string>('test-key');
    const classFake = fakeClass();
    expect(reflection.delete(classFake)).toBe(false);
  });

  test('Scenario 65: ReflectionMap set stores value in map', () => {
    const reflectionMap = new ReflectionMap<string>('test-map');
    const classFake = fakeClass();
    reflectionMap.set('key1', 'value1', classFake);
    expect(reflectionMap.get('key1', classFake)).toBe('value1');
  });

  test('Scenario 66: ReflectionMap set stores multiple values in map', () => {
    const reflectionMap = new ReflectionMap<string>('test-map');
    const classFake = fakeClass();
    reflectionMap.set('key1', 'value1', classFake);
    reflectionMap.set('key2', 'value2', classFake);
    expect(reflectionMap.get('key1', classFake)).toBe('value1');
    expect(reflectionMap.get('key2', classFake)).toBe('value2');
  });

  test('Scenario 67: ReflectionMap set with propertyKey stores value in map', () => {
    const reflectionMap = new ReflectionMap<string>('test-map');
    const classFake = fakeClass();
    reflectionMap.set('key1', 'value1', classFake, 'fakeProperty');
    expect(reflectionMap.get('key1', classFake, 'fakeProperty')).toBe('value1');
  });

  test('Scenario 68: ReflectionMap get returns undefined for non-existent key', () => {
    const reflectionMap = new ReflectionMap<string>('test-map');
    const classFake = fakeClass();
    expect(reflectionMap.get('key1', classFake)).toBeUndefined();
  });

  test('Scenario 69: ReflectionMap has returns true when key exists', () => {
    const reflectionMap = new ReflectionMap<string>('test-map');
    const classFake = fakeClass();
    reflectionMap.set('key1', 'value1', classFake);
    expect(reflectionMap.has('key1', classFake)).toBe(true);
  });

  test('Scenario 70: ReflectionMap has returns false when key does not exist', () => {
    const reflectionMap = new ReflectionMap<string>('test-map');
    const classFake = fakeClass();
    expect(reflectionMap.has('key1', classFake)).toBe(false);
  });

  test('Scenario 71: ReflectionMap has returns false when map does not exist', () => {
    const reflectionMap = new ReflectionMap<string>('test-map');
    const classFake = fakeClass();
    expect(reflectionMap.has('key1', classFake)).toBe(false);
  });

  test('Scenario 72: ReflectionMap delete removes key from map', () => {
    const reflectionMap = new ReflectionMap<string>('test-map');
    const classFake = fakeClass();
    reflectionMap.set('key1', 'value1', classFake);
    reflectionMap.delete('key1', classFake);
    expect(reflectionMap.get('key1', classFake)).toBeUndefined();
  });

  test('Scenario 73: ReflectionMap delete does nothing when map does not exist', () => {
    const reflectionMap = new ReflectionMap<string>('test-map');
    const classFake = fakeClass();
    reflectionMap.delete('key1', classFake);
    expect(reflectionMap.get('key1', classFake)).toBeUndefined();
  });

  test('Scenario 74: ReflectionMap set with numeric key stores value in map', () => {
    const reflectionMap = new ReflectionMap<string>('test-map');
    const classFake = fakeClass();
    reflectionMap.set(123, 'value1', classFake);
    expect(reflectionMap.get(123, classFake)).toBe('value1');
  });

  test('Scenario 75: ReflectionSet add stores value in set', () => {
    const reflectionSet = new ReflectionSet<string>('test-set');
    const classFake = fakeClass();
    reflectionSet.add('value1', classFake);
    expect(reflectionSet.has('value1', classFake)).toBe(true);
  });

  test('Scenario 76: ReflectionSet add stores multiple values in set', () => {
    const reflectionSet = new ReflectionSet<string>('test-set');
    const classFake = fakeClass();
    reflectionSet.add('value1', classFake);
    reflectionSet.add('value2', classFake);
    expect(reflectionSet.has('value1', classFake)).toBe(true);
    expect(reflectionSet.has('value2', classFake)).toBe(true);
  });

  test('Scenario 77: ReflectionSet add with propertyKey stores value in set', () => {
    const reflectionSet = new ReflectionSet<string>('test-set');
    const classFake = fakeClass();
    reflectionSet.add('value1', classFake, 'fakeProperty');
    expect(reflectionSet.has('value1', classFake, 'fakeProperty')).toBe(true);
  });

  test('Scenario 78: ReflectionSet has returns false for non-existent value', () => {
    const reflectionSet = new ReflectionSet<string>('test-set');
    const classFake = fakeClass();
    expect(reflectionSet.has('value1', classFake)).toBe(false);
  });

  test('Scenario 79: ReflectionSet getAll returns all values from set', () => {
    const reflectionSet = new ReflectionSet<string>('test-set');
    const classFake = fakeClass();
    reflectionSet.add('value1', classFake);
    reflectionSet.add('value2', classFake);
    const values = reflectionSet.getAll(classFake);
    expect(values).toContain('value1');
    expect(values).toContain('value2');
    expect(values).toHaveLength(2);
  });

  test('Scenario 80: ReflectionSet getAll returns empty array when set does not exist', () => {
    const reflectionSet = new ReflectionSet<string>('test-set');
    const classFake = fakeClass();
    const values = reflectionSet.getAll(classFake);
    expect(values).toEqual([]);
  });

  test('Scenario 81: ReflectionSet getAll returns inherited values', () => {
    const reflectionSet = new ReflectionSet<string>('test-set');
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflectionSet.add('value1', baseClass);
    reflectionSet.add('value2', inheritedClass);
    const values = reflectionSet.getAll(inheritedClass);
    expect(values).toContain('value1');
    expect(values).toContain('value2');
    expect(values).toHaveLength(2);
  });

  test('Scenario 82: ReflectionSet has returns true for inherited values', () => {
    const reflectionSet = new ReflectionSet<string>('test-set');
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflectionSet.add('value1', baseClass);
    expect(reflectionSet.has('value1', inheritedClass)).toBe(true);
  });

  test('Scenario 83: ReflectionSet add does not duplicate values', () => {
    const reflectionSet = new ReflectionSet<string>('test-set');
    const classFake = fakeClass();
    reflectionSet.add('value1', classFake);
    reflectionSet.add('value1', classFake);
    const values = reflectionSet.getAll(classFake);
    expect(values).toHaveLength(1);
  });

  test('Scenario 84: ReflectionSet getAll merges inherited sets without duplicates', () => {
    const reflectionSet = new ReflectionSet<string>('test-set');
    const { baseClass, inheritedClass } = fakeClassInheritance();
    reflectionSet.add('value1', baseClass);
    reflectionSet.add('value1', inheritedClass);
    reflectionSet.add('value2', inheritedClass);
    const values = reflectionSet.getAll(inheritedClass);
    expect(values).toContain('value1');
    expect(values).toContain('value2');
    expect(values).toHaveLength(2);
  });
});
