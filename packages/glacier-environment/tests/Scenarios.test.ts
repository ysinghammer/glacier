import * as process from 'node:process';

import { fakeEnvClass } from './fakes/fakeEnvClass';

describe('@glacier/logger Scenarios', () => {
  test('Scenario 1: Should read a simple environment variable', () => {
    const envClass = fakeEnvClass();
    process.env.TEST = '{{TEST}}';
    expect(envClass.proxyGet({ key: 'TEST', type: 'string' })).toBe('{{TEST}}');
    delete process.env.TEST;
  });

  test('Scenario 2: Should return undefined if environment variable does not exist', () => {
    const envClass = fakeEnvClass();
    expect(envClass.proxyGet({ key: 'TEST', type: 'string' })).toBeUndefined();
  });

  test('Scenario 3: Should read a numeric environment variable', () => {
    const envClass = fakeEnvClass();
    process.env.TEST = '2';
    expect(envClass.proxyGet({ key: 'TEST', type: 'number' })).toBe(2);
    delete process.env.TEST;
  });

  test('Scenario 4: Should read a boolean environment variable', () => {
    const envClass = fakeEnvClass();
    process.env.TEST = 'true';
    expect(envClass.proxyGet({ key: 'TEST', type: 'boolean' })).toBe(true);
    delete process.env.TEST;
  });

  test('Scenario 5: Should read a numeric boolean environment variable', () => {
    const envClass = fakeEnvClass();
    process.env.TEST = '1';
    expect(envClass.proxyGet({ key: 'TEST', type: 'boolean' })).toBe(true);
    delete process.env.TEST;
  });

  test('Scenario 6: Should read a string array environment variable', () => {
    const envClass = fakeEnvClass();
    process.env.TEST = 'a,b,c';
    expect(envClass.proxyGet({ key: 'TEST', type: 'string', isArray: true })).toEqual([
      'a',
      'b',
      'c'
    ]);
    delete process.env.TEST;
  });

  test('Scenario 7: Should read a numeric array environment variable', () => {
    const envClass = fakeEnvClass();
    process.env.TEST = '1,2,3';
    expect(envClass.proxyGet({ key: 'TEST', type: 'number', isArray: true })).toEqual([1, 2, 3]);
    delete process.env.TEST;
  });

  test('Scenario 8: Should read a boolean array environment variable', () => {
    const envClass = fakeEnvClass();
    process.env.TEST = 'true,false,true';
    expect(envClass.proxyGet({ key: 'TEST', type: 'boolean', isArray: true })).toEqual([
      true,
      false,
      true
    ]);
    delete process.env.TEST;
  });

  test('Scenario 9: Should throw an error if environment variable does not exist', () => {
    const envClass = fakeEnvClass();
    expect(() => envClass.proxyGetOrThrow({ key: 'TEST', type: 'string' })).toThrow();
  });

  test('Scenario 10: Should not throw an error if environment variable  exist', () => {
    const envClass = fakeEnvClass();
    process.env.TEST = '{{TEST}}';
    expect(envClass.proxyGetOrThrow({ key: 'TEST', type: 'string' })).toBe('{{TEST}}');
    delete process.env.TEST;
  });
});
