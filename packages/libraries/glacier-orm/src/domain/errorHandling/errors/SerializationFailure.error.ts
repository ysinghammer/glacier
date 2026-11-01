import { PgError } from "./PgError.error.js";

/** PostgreSQL could not serialize a transaction. */
export class SerializationFailure extends PgError {
  /**
   * Retains the serialization failure's PostgreSQL diagnostics.
   * @param code PostgreSQL SQLSTATE.
   * @param constraint Server-reported constraint name, if present.
   * @param cause Original error responsible for the failure.
   */
  public constructor(code: string, constraint: string | undefined, cause: Error) {
    super(code, constraint, cause);
  }
}
