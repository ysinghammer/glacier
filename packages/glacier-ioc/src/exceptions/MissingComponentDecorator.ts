import type { Constructor } from '@glacier/utils';

export class MissingComponentDecorator extends Error {
  public constructor(cls: Constructor) {
    super(`Expected class ${cls.name} to be decorated with @Component or @Module.`);
  }
}
