import { OrmError } from "./OrmError.error.js";

/** A query expecting a row found none. */
export class NoRowsError extends OrmError {
  /** Creates a failure for an empty result where exactly one row was required. */
  public constructor() {
    super("Expected one row but received none");
  }
}
