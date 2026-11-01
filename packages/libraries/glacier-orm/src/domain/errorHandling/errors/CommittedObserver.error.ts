import { OrmError } from "./OrmError.error.js";

/** The database committed successfully, but its query observer failed afterward. */
export class CommittedObserverError extends OrmError {
  /**
   * Records an observer failure after a successful commit.
   * @param cause Observer failure; it may contain sensitive details.
   */
  public constructor(cause: unknown) {
    super("Transaction committed but its query observer failed", { cause });
  }
}
