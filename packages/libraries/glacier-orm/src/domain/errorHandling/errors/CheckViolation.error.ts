import { PgError } from "./PgError.error.js";

/** PostgreSQL rejected a check constraint violation. */
export class CheckViolation extends PgError {
  /**
   * Retains the check-constraint failure's PostgreSQL diagnostics.
   * @param code PostgreSQL SQLSTATE.
   * @param constraint Server-reported constraint name, if present.
   * @param cause Original error responsible for the failure.
   */
  public constructor(code: string, constraint: string | undefined, cause: Error) {
    super(code, constraint, cause);
  }
}
