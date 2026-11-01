import type { ISchemaIssue } from "@glacier/schema";
import { OrmError } from "./OrmError.error.js";

/** Describes a database result row that does not match the requested schema. */
export class RowValidationError extends OrmError {
  /** Zero-based index of the invalid row in the result. */
  public readonly rowIndex: number;
  /** Schema issues reported for the row, in their original order. */
  public readonly issues: readonly ISchemaIssue[];

  /**
   * Creates a row mismatch without embedding potentially sensitive row values in its message.
   * @param rowIndex Zero-based position of the invalid row.
   * @param issues Schema issues describing the mismatch.
   * @param options Optional native error options, including an underlying cause.
   */
  public constructor(rowIndex: number, issues: readonly ISchemaIssue[], options?: ErrorOptions) {
    super(`Result row ${rowIndex} failed schema validation`, options);
    this.rowIndex = rowIndex;
    this.issues = issues;
  }
}
