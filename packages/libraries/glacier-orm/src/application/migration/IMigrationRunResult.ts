/**
 * Applied count or a filename or immutable database history rejection.
 * @property ok Discriminates successful execution from rejection.
 * @property applied Number newly applied, present only on success.
 * @property reason Rejection category, present only on failure.
 */
export type IMigrationRunResult =
  | { readonly ok: true; readonly applied: number }
  | { readonly ok: false; readonly reason: "names" | "history" };
