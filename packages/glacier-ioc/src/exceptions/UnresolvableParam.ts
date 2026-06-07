import type { Constructor } from '@glacier/utils';

export class UnresolvableParam extends Error {
  public constructor(cls: Constructor, param: unknown, paramLocation: number) {
    super(
      `Can not resolve ${paramLocation.toString()} parameter of ${cls.name} because it is of type ${typeof param}`
    );
  }
}
