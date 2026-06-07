import { Readable } from 'node:stream';

import { compareArray, getMethodNames, isConstructor, streamToBuffer } from '../src';

it('Scenario 1: should return true if value is a custom constructor', () => {
  class A {}
  expect(isConstructor(A)).toBe(true);
});

it('Scenario 2: should return false if value is a primitive', () => {
  expect(isConstructor(1)).toBe(false);
  expect(isConstructor(true)).toBe(false);
  expect(isConstructor('test')).toBe(false);
  expect(isConstructor(Symbol())).toBe(false);
});

it('Scenario 3: should return false if value is a built in class', () => {
  expect(isConstructor(String)).toBe(false);
});

it('Scenario 4: should return false if value is an array', () => {
  expect(isConstructor([])).toBe(false);
});

it('Scenario 5: should return true if arrays are equal', () => {
  expect(compareArray([1, 2, 3], [1, 2, 3])).toEqual(true);
});

it('Scenario 6: should return false if arrays have different lengths', () => {
  expect(compareArray([1], [1, 2])).toBe(false);
});

it('Scenario 7: should return false if array items are different', () => {
  expect(compareArray([2, 1], [1, 2])).toBe(false);
});

it('Scenario 8: should return an empty array if class has no methods', () => {
  class A {}
  expect(getMethodNames(A)).toEqual([]);
});

it('Scenario 9: should return all methods of the class', () => {
  class A {
    getA() {
      throw new Error('Not Implemented');
    }
    getB() {
      throw new Error('Not Implemented');
    }
  }

  expect(getMethodNames(A)).toEqual(['getA', 'getB']);
});

it('Scenario 10: should return all methods of parent class', () => {
  class A {
    getA() {
      throw new Error('Not Implemented');
    }
    getB() {
      throw new Error('Not Implemented');
    }
  }

  class B extends A {
    getC() {
      throw new Error('Not Implemented');
    }
  }

  expect(getMethodNames(B)).toEqual(['getC', 'getA', 'getB']);
});

it('Scenario 11: should return the content of the stream as a Buffer', async () => {
  const stream = new Readable();
  stream.push('A');
  stream.push('B');
  stream.push(null);
  const result = await streamToBuffer(stream);
  expect(result.toString()).toBe('AB');
});

it('Scenario 12: should reject the promise if an error occurred', async () => {
  const error = new Error('Test');
  await expect(async () => {
    const stream = new Readable();
    stream.destroy(error);
    return streamToBuffer(stream);
  }).rejects.toBe(error);
});
