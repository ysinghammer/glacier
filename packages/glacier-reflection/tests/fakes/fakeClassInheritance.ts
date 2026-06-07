export function fakeClassInheritance() {
  class BaseClass {
    public baseFakeProperty: string = 'This is a base fake property';
    public baseFakeMethod(baseFakeParameter: string): string {
      return 'This is a base fake method with a base fake parameter: ' + baseFakeParameter;
    }
  }

  class InheritedClass extends BaseClass {
    public fakeProperty: string = 'This is a fake property';
    public fakeMethod(fakeParameter: string): string {
      return 'This is a fake method with a fake parameter: ' + fakeParameter;
    }
  }

  return { baseClass: BaseClass, inheritedClass: InheritedClass };
}
