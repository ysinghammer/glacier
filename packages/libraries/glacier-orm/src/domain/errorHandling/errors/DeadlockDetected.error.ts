import { PgError } from "./PgError.error.js";

/** PostgreSQL detected a transaction deadlock. */
export class DeadlockDetected extends PgError {
  /**
   * Retains the deadlock failure's PostgreSQL diagnostics.
   * @param code PostgreSQL SQLSTATE.
   * @param constraint Server-reported constraint name, if present.
   * @param cause Original error responsible for the failure.
   */
  public constructor(code: string, constraint: string | undefined, cause: Error) {
    super(code, constraint, cause);
  }
}
