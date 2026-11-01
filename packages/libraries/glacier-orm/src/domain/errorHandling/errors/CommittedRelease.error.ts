import { OrmError } from "./OrmError.error.js";

/** The database committed successfully, but releasing its client failed afterward. */
export class CommittedReleaseError extends OrmError {
  /**
   * Records a client release failure after a successful commit.
   * @param cause Original release failure; it may contain sensitive details.
   */
  public constructor(cause: unknown) {
    super("Transaction committed but its client release failed", { cause });
  }
}
