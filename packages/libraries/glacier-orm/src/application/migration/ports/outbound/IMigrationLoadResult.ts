import type { IMigration } from "../../../../domain/migration/IMigration.js";

/**
 * Loaded migration files or a filename/sequence rejection.
 * @property ok Discriminates successful loading from rejection.
 * @property migrations Loaded files in execution order, present only on success.
 */
export type IMigrationLoadResult =
  | { readonly ok: true; readonly migrations: readonly IMigration[] }
  | { readonly ok: false };
