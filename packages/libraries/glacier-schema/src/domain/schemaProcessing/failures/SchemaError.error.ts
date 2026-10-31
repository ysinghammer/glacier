import type { ISchemaIssue } from "./ISchemaIssue.js";
import { SCHEMA_ERROR_BRAND } from "./SchemaErrorBrand.js";

/**
 * Thrown by `parse` when input does not satisfy a class schema. Carries every issue found and has no
 * HTTP concepts; adapters map it with `Schema.isError`.
 */
export class SchemaError extends Error {
  /** Stable code adapters can match on without relying on the class identity. */
  public readonly code = "SCHEMA_VALIDATION_FAILED";
  /** Brand read by `Schema.isError`. */
  public readonly [SCHEMA_ERROR_BRAND] = true;
  /** Every issue found, in field declaration order. */
  public readonly issues: readonly ISchemaIssue[];

  /** Creates the error from a non-empty issue list. */
  public constructor(issues: readonly ISchemaIssue[]) {
    super(`Schema validation failed with ${issues.length} issue${issues.length === 1 ? "" : "s"}`);
    this.name = "SchemaError";
    this.issues = issues;
  }

  /** Returns a JSON-safe description; bigint issue parameters are rendered as `123n` strings. */
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
