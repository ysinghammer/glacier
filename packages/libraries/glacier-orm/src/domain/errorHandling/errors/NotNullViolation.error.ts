import { PgError } from "./PgError.error.js";

/** PostgreSQL rejected a null value in a required column. */
export class NotNullViolation extends PgError {
  /**
   * Retains the not-null failure's PostgreSQL diagnostics.
   * @param code PostgreSQL SQLSTATE.
   * @param constraint Server-reported constraint name, if present.
   * @param cause Original error responsible for the failure.
   */
  public constructor(code: string, constraint: string | undefined, cause: Error) {
    super(code, constraint, cause);
  }
}
