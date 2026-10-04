/** Converts finite tuple keys to numeric positions. */
type ITuplePosition<T> = T extends `${infer N extends number}` ? N : never;
/** Optional finite positions are checked; open/rest lists expose number. */
export type IParameterIndex<T extends readonly unknown[]> = number extends T["length"]
  ? number
  : ITuplePosition<Exclude<keyof T, keyof (readonly unknown[])>>;
