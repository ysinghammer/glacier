import { PgError } from "./PgError.error.js";

/** PostgreSQL rejected a duplicate value under a unique constraint. */
export class UniqueViolation extends PgError {
  /**
   * Retains the unique-constraint failure's PostgreSQL diagnostics.
   * @param code PostgreSQL SQLSTATE.
   * @param constraint Server-reported constraint name, if present.
   * @param cause Original error responsible for the failure.
   */
  public constructor(code: string, constraint: string | undefined, cause: Error) {
    super(code, constraint, cause);
  }
}
