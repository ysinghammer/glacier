export interface Constructor<T = unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any --- As we want to target all possible constructors, the arguments must be of any type.
  new (...args: any[]): T;
  prototype: object;
}
