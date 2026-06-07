export class ValueNotAConstructor extends Error {
  public constructor(value: unknown) {
    super(`Expected given value to be a constructor but got ${typeof value}`);
  }
}
