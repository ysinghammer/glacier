/** Converts a numeric string tuple key into its numeric literal position.
 * @template T Tuple key representation being converted.
 */
type ITuplePosition<T> = T extends `${infer N extends number}` ? N : never;
/** Parameter positions for a tuple; open/rest tuples expose number instead of finite indices.
 * @template T Parameter tuple whose valid positions are represented.
 */
export type IParameterIndex<T extends readonly unknown[]> = number extends T["length"]
  ? number
  : ITuplePosition<Exclude<keyof T, keyof (readonly unknown[])>>;
