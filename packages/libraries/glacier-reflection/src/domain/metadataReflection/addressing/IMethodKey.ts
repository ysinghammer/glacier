/** Callable public keys, including optional callable members. */
export type IMethodKey<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends (...arguments_: never[]) => unknown ? K : never;
}[keyof T];
