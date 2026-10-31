import type { ISchemaIssue } from "./ISchemaIssue.js";
import { SCHEMA_ERROR_BRAND } from "./SchemaErrorBrand.js";

/**
 * Thrown by `parse` when input does not satisfy a class schema. Carries every issue found and has no
 * HTTP concepts; adapters map it with `Schema.isError`.
 */
export class SchemaError extends Error {
  /**
   * Stable validation-failure code for matching without relying on class identity.
   * @default "SCHEMA_VALIDATION_FAILED"
   */
  public readonly code = "SCHEMA_VALIDATION_FAILED";
  /**
   * Brand recognised by `Schema.isError` across package copies.
   * @default true
   */
  public readonly [SCHEMA_ERROR_BRAND] = true;
  /** Readonly issues from the failed parse, ordered by field declaration. */
  public readonly issues: readonly ISchemaIssue[];

  /**
   * Constructs the parse failure with a count-based summary message.
   * @param issues All issues reported by the failed schema parse.
   */
  public constructor(issues: readonly ISchemaIssue[]) {
    super(`Schema validation failed with ${issues.length} issue${issues.length === 1 ? "" : "s"}`);
    this.name = "SchemaError";
    this.issues = issues;
  }

  /**
   * Creates a JSON-safe error record, rendering bigint parameters as suffixed strings.
   * @returns Error name, stable code, summary message and issue list with JSON-safe parameters.
   */
  public toJSON(): {
    readonly name: string;
    readonly code: string;
    readonly message: string;
    readonly issues: readonly ISchemaIssue[];
  } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      issues: this.issues.map((issue) => ({
        ...issue,
        params: Object.fromEntries(
          Object.entries(issue.params).map(([name, value]) => [
            name,
            typeof value === "bigint" ? `${value}n` : value,
          ]),
        ),
      })),
    };
  }
}
