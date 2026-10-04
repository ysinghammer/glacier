/** Exposed callable tuple; overloads use the final visible signature. */
export type IMethodParameters<T> = T extends (...arguments_: infer P) => unknown ? P : never;
