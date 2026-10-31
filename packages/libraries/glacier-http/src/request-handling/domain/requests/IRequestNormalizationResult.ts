/** Internal transport normalization outcome; ordinary invalid input is not an exception. */
export type IRequestNormalizationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly status: 400 | 414 };
