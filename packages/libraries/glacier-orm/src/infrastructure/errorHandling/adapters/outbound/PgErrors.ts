import pg from "pg";
import { CheckViolation } from "../../../../domain/errorHandling/errors/CheckViolation.error.js";
import { DeadlockDetected } from "../../../../domain/errorHandling/errors/DeadlockDetected.error.js";
import { ForeignKeyViolation } from "../../../../domain/errorHandling/errors/ForeignKeyViolation.error.js";
import { NotNullViolation } from "../../../../domain/errorHandling/errors/NotNullViolation.error.js";
import { SerializationFailure } from "../../../../domain/errorHandling/errors/SerializationFailure.error.js";
import { UniqueViolation } from "../../../../domain/errorHandling/errors/UniqueViolation.error.js";

/** Translates recognized node-postgres server failures without changing other values. */
export class PgErrors {
  /**
   * Maps known SQLSTATEs to specific ORM errors, retaining their server error as the cause.
   * @param error Any caught value; only node-postgres database errors are translated.
   * @returns A translated error or the original value unchanged for unrecognized failures.
   */
  public static map(error: unknown): unknown {
    if (!(error instanceof pg.DatabaseError)) return error;

    switch (error.code) {
      case "23505":
        return new UniqueViolation(error.code, error.constraint, error);
      case "23503":
        return new ForeignKeyViolation(error.code, error.constraint, error);
      case "23502":
        return new NotNullViolation(error.code, error.constraint, error);
      case "23514":
        return new CheckViolation(error.code, error.constraint, error);
      case "40001":
        return new SerializationFailure(error.code, error.constraint, error);
      case "40P01":
        return new DeadlockDetected(error.code, error.constraint, error);
      default:
        return error;
    }
  }
}
