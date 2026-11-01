import pg from "pg";
import { describe, expect, it } from "vitest";
import {
  CheckViolation,
  DeadlockDetected,
  ForeignKeyViolation,
  NoRowsError,
  NotNullViolation,
  OrmError,
  PgError,
  PgErrors,
  RowValidationError,
  SerializationFailure,
  TooManyRowsError,
  UniqueViolation,
} from "../../../index.js";
import type { ISchemaIssue } from "@glacier/schema";

describe("PostgreSQL error translation", () => {
  it.each([
    ["23505", UniqueViolation],
    ["23503", ForeignKeyViolation],
    ["23502", NotNullViolation],
    ["23514", CheckViolation],
    ["40001", SerializationFailure],
    ["40P01", DeadlockDetected],
  ])("maps SQLSTATE %s to its specific error with original diagnostics", (code, ErrorClass) => {
    const cause = new pg.DatabaseError("secret database details", 0, "error");
    cause.code = code;
    cause.constraint = "example_constraint";

    const result = PgErrors.map(cause);

    expect(result).toBeInstanceOf(ErrorClass);
    expect(result).toBeInstanceOf(PgError);
    expect(result).toBeInstanceOf(OrmError);
    expect(result).toMatchObject({
      name: ErrorClass.name,
      code,
      constraint: "example_constraint",
      cause,
      message: `PostgreSQL failure (${code})`,
    });
  });

  it("preserves an absent constraint and the original cause", () => {
    const cause = new pg.DatabaseError("details", 0, "error");
    cause.code = "23505";
    const result = PgErrors.map(cause);
    expect(result).toBeInstanceOf(UniqueViolation);
    expect(result).toMatchObject({ code: "23505", constraint: undefined, cause });
  });

  it("returns unrecognized and missing SQLSTATE database errors unchanged", () => {
    const unknown = new pg.DatabaseError("unknown", 0, "error");
    unknown.code = "99999";
    const missing = new pg.DatabaseError("missing", 0, "error");
    expect(PgErrors.map(unknown)).toBe(unknown);
    expect(PgErrors.map(missing)).toBe(missing);
  });

  it("returns non-database errors and arbitrary caught values unchanged, even with a matching code", () => {
    const error = Object.assign(new Error("network"), { code: "23505" });
    const object = { code: "23505", constraint: "fake" };
    for (const value of [error, object, null, undefined, "23505", 0]) {
      expect(PgErrors.map(value)).toBe(value);
    }
  });
});

describe("ORM failure descriptions", () => {
  it("preserves messages, names and causes for base errors", () => {
    const cause = new Error("cause");
    const base = new OrmError("failure", { cause });
    const pgError = new PgError("12345", undefined, cause);
    expect(base).toMatchObject({ name: "OrmError", message: "failure", cause });
    expect(pgError).toMatchObject({ name: "PgError", code: "12345", constraint: undefined, cause });
  });

  it("distinguishes empty and multiple result failures", () => {
    const empty = new NoRowsError();
    const multiple = new TooManyRowsError();
    expect(empty).toBeInstanceOf(OrmError);
    expect(empty).toMatchObject({
      name: "NoRowsError",
      message: "Expected one row but received none",
    });
    expect(multiple).toBeInstanceOf(OrmError);
    expect(multiple).toMatchObject({
      name: "TooManyRowsError",
      message: "Expected one row but received multiple rows",
    });
  });

  it("retains row index, typed issues and an optional cause without including row data", () => {
    const issues: readonly ISchemaIssue[] = [
      { code: "invalid_type", path: ["id"], message: "Expected number", params: {} },
    ];
    const cause = new Error("underlying mismatch");
    const error = new RowValidationError(2, issues, { cause });
    expect(error).toBeInstanceOf(OrmError);
    expect(error).toMatchObject({
      name: "RowValidationError",
      message: "Result row 2 failed schema validation",
      rowIndex: 2,
      issues,
      cause,
    });
    expect(error.issues).toBe(issues);
    expect(new RowValidationError(0, []).cause).toBeUndefined();
  });
});
