import { OrmError } from "./OrmError.error.js";

/** Base for translated PostgreSQL failures, retaining diagnostic metadata and the original cause. */
export class PgError extends OrmError {
  /** PostgreSQL SQLSTATE supplied by the server. */
  public readonly code: string;
  /** Server-reported constraint name, or undefined when unavailable. */
  public readonly constraint: string | undefined;

  /**
   * Creates a PostgreSQL failure with a summary that excludes the original server message.
   * @param code PostgreSQL SQLSTATE identifying the failure.
   * @param constraint Server-reported constraint name, if present.
   * @param cause Original error responsible for the failure.
   */
  public constructor(code: string, constraint: string | undefined, cause: Error) {
    super(`PostgreSQL failure (${code})`, { cause });
    this.code = code;
    this.constraint = constraint;
  }
}
