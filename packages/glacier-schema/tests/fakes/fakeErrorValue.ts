export function fakeErrorValue(): { value: unknown } {
  return new Proxy<{ value: unknown }>(
    { value: '' },
    {
      get() {
        throw new Error('Unknown error');
      }
    }
  );
}
