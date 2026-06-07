import { Context } from '../src';

test('Scenario 1: should execute a given function when called with run', () => {
  const context = new Context();
  const fn = jest.fn();
  context.run(fn);
  expect(fn).toHaveBeenCalledWith();
});

test('Scenario 2: should return undefined when getContext is called without any context', () => {
  const context = new Context();
  expect(context.getContext()).toBeUndefined();
});

test('Scenario 3: should return a symbol when getContext is run inside a context', () => {
  const context = new Context();
  context.run(() => {
    expect(context.getContext()).toEqual(expect.any(Symbol));
  });
});

it('Scenario 4: should return undefined if getId is called without any context', () => {
  const context = new Context();
  expect(context.getId()).toBeUndefined();
});

it('Scenario 5: should return an id when getId is run inside a context', () => {
  const context = new Context();
  context.run(() => {
    expect(context.getId()).toEqual(expect.any(String));
  });
});
