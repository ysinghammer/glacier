/**
 * Typed result for request normalization; malformed input is represented without throwing.
 * @template T Normalized value type produced when parsing succeeds.
 * @property ok True when the input was normalized successfully.
 * @property value Normalized data, present only for a successful result.
 * @property status HTTP 400 or 414 selected for rejected input.
 */
export type IRequestNormalizationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly status: 400 | 414 };
