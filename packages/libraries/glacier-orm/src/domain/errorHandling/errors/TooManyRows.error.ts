import { OrmError } from "./OrmError.error.js";

/** A query expecting one row found multiple rows. */
export class TooManyRowsError extends OrmError {
  /** Creates a failure for a result containing more than one row. */
  public constructor() {
    super("Expected one row but received multiple rows");
  }
}
