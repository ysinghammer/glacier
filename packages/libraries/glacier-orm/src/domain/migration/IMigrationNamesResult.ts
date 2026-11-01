/**
 * Validated ordered migration names, or an invalid-name or sequence rejection.
 * @property ok Discriminates successful validation from rejection.
 * @property names Ordered filenames, present only on success.
 */
export type IMigrationNamesResult =
  | { readonly ok: true; readonly names: readonly string[] }
  | { readonly ok: false };
