// eslint-disable-next-line @typescript-eslint/no-explicit-any --- As we want to target all possible constructors, the arguments must be of any type.
export type AbstractConstructor<T = unknown> = abstract new (...args: any[]) => T;
