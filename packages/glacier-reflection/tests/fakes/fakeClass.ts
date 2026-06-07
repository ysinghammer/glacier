export function fakeClass() {
  return class FakeClass {
    public fakeProperty: string = 'This is a fake property';
    public fakeMethod(fakeParameter: string): string {
      return 'This is a fake method with a fake parameter: ' + fakeParameter;
    }
  };
}
