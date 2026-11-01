/**
 * Parsed CLI arguments or a rejected command line.
 * @property ok Discriminates successful parsing from rejection.
 * @property directory Selected migration directory, present only on success.
 * @property databaseUrl PostgreSQL connection URL, present only on success and potentially secret.
 */
export type IMigrationArguments =
  | { readonly ok: true; readonly directory: string; readonly databaseUrl: string }
  | { readonly ok: false };
