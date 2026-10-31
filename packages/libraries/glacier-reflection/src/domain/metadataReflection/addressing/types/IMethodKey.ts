/** Selects keys whose non-nullable member values are callable, including optional methods.
 * @template T Object surface whose callable keys are selected.
 */
export type IMethodKey<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends (...arguments_: never[]) => unknown ? K : never;
}[keyof T];
