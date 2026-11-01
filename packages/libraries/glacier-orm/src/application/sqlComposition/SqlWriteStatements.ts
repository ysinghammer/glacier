import type { IConstructableClass } from "@glacier/reflection";
import { PartialType, Schema } from "@glacier/schema";
import type { IResult, ISchemaIssue } from "@glacier/schema";
import { SqlFragment } from "../../domain/sqlComposition/SqlFragment.js";
import { SqlIdentifiers } from "../../domain/sqlComposition/SqlIdentifiers.js";
import type { ITableColumn } from "../../domain/tableMapping/types/ITableColumn.js";
import type { ITableMapping } from "../../domain/tableMapping/types/ITableMapping.js";
import { TableMapping } from "../tableMapping/TableMapping.js";

/** Validated logical row together with the caller's supplied own properties. */
interface IWriteRow {
  /** Snapshot of caller-supplied logical property names before schema callbacks run. */
  readonly supplied: ReadonlySet<string>;
  /** Snapshot of normalized field values used to construct parameters. */
  readonly values: ReadonlyMap<string, unknown>;
}

/** Validates table writes and constructs parameterized insert and update fragments. */
export class SqlWriteStatements {
  /**
   * Validates every insert row and composes identically shaped parameter tuples.
   * @template T Instance type of the table schema.
   * @param target Decorated table schema used for full-row validation.
   * @param input Single logical row or sequence of logical rows.
   * @returns Insert fragment or all row and shape validation issues.
   */
  public static values<T extends object>(
    target: IConstructableClass<T>,
    input: T | readonly T[],
  ): IResult<SqlFragment> {
    const mapping = TableMapping.read(target);
    const isBatch = Array.isArray(input);
    const inputs: readonly unknown[] = isBatch
      ? Array.from({ length: input.length }, (_, index) => input[index])
      : [input];
    if (inputs.length === 0) return SqlWriteStatements.failure([], "empty_rows");
    const first = SqlWriteStatements.validate(target, mapping, inputs[0]);
    const following = Array.from(inputs.slice(1), (row) =>
      SqlWriteStatements.validate(target, mapping, row),
    );
    const issues: ISchemaIssue[] = [];
    const followingRows: IWriteRow[] = [];
    if (!first.ok) issues.push(...SqlWriteStatements.rowIssues(first.issues, isBatch, 0));
    for (const [index, result] of following.entries()) {
      if (!result.ok)
        issues.push(...SqlWriteStatements.rowIssues(result.issues, isBatch, index + 1));
      else followingRows.push(result.value);
    }
    if (!first.ok || issues.length > 0) return { ok: false, issues };
    const columns = SqlWriteStatements.insertColumns(mapping, first.value);
    const rows: IWriteRow[] = [first.value];
    for (const [index, row] of followingRows.entries()) {
      const current = SqlWriteStatements.insertColumns(mapping, row);
      if (!SqlWriteStatements.sameColumns(columns, current)) {
        issues.push(SqlWriteStatements.issue([index + 1], "mismatched_columns"));
      }
      rows.push(row);
    }
    if (issues.length > 0) return { ok: false, issues };
    return { ok: true, value: SqlWriteStatements.valuesFragment(columns, rows) };
  }

  /**
   * Validates supplied fields against a shallow partial schema and composes assignments.
   * @template T Instance type of the table schema.
   * @param target Decorated table schema used for field validation.
   * @param input Logical patch whose fields are bound after normalization.
   * @returns Assignment fragment or typed validation issues.
   */
  public static set<T extends object>(
    target: IConstructableClass<T>,
    input: Partial<T>,
  ): IResult<SqlFragment> {
    const mapping = TableMapping.read(target);
    const partial = PartialType(target);
    const result = SqlWriteStatements.validate(partial, mapping, input);
    if (!result.ok) return result;
    const columns = mapping.columns.filter((column) => result.value.values.has(column.property));
    return { ok: true, value: SqlWriteStatements.setFragment(columns, result.value.values) };
  }

  /**
   * Checks supplied properties and runs schema validation without hiding any rejection.
   * @template T Instance type returned by the full or partial schema.
   * @param schema Full or shallow partial schema for the candidate row.
   * @param mapping Effective table fields used to reject unknown properties.
   * @param input Untrusted candidate row.
   * @returns Normalized values and supplied-property snapshot, or every detected issue.
   */
  private static validate<T extends object>(
    schema: IConstructableClass<T>,
    mapping: ITableMapping,
    input: unknown,
  ): IResult<IWriteRow> {
    if (typeof input !== "object" || input === null || Array.isArray(input))
      return SqlWriteStatements.failure([], "invalid_row");
    const keys = Reflect.ownKeys(input);
    const supplied = new Set(keys.filter((key) => typeof key === "string"));
    const issues = SqlWriteStatements.inputIssues(mapping, input, keys);
    const result = Schema.safeParseLogical(schema, input);
    if (!result.ok) return { ok: false, issues: [...issues, ...result.issues] };
    const values = SqlWriteStatements.snapshot(mapping, result.value, supplied, issues);
    if (issues.length > 0) return { ok: false, issues };
    return { ok: true, value: { supplied, values } };
  }

  /**
   * Captures validated field values and records missing or undefined normalized values.
   * @param mapping Effective table fields in declaration order.
   * @param result Parsed schema instance whose field values are captured.
   * @param supplied Logical property names supplied before parsing.
   * @param issues Mutable accumulator receiving normalized-value issues.
   * @returns Map of defined normalized values, preserving their identities.
   */
  private static snapshot(
    mapping: ITableMapping,
    result: object,
    supplied: ReadonlySet<string>,
    issues: ISchemaIssue[],
  ): ReadonlyMap<string, unknown> {
    const values = new Map<string, unknown>();
    for (const column of mapping.columns) {
      const hasUndefinedInput = issues.some(
        (issue) => issue.path[0] === column.property && issue.params.reason === "undefined_input",
      );
      const hasResult = Object.hasOwn(result, column.property);
      const value: unknown = hasResult ? Reflect.get(result, column.property) : undefined;
      const isUndefinedResult = hasResult && value === undefined;
      const isMissingSuppliedResult = supplied.has(column.property) && !hasResult;
      if ((isUndefinedResult || isMissingSuppliedResult) && !hasUndefinedInput)
        issues.push(SqlWriteStatements.issue([column.property], "undefined_result"));
      if (hasResult && value !== undefined) values.set(column.property, value);
    }
    return values;
  }

  /**
   * Rejects empty inputs, undeclared properties and explicitly undefined supplied values.
   * @param mapping Effective table properties.
   * @param input Candidate row whose own keys are inspected.
   * @param keys Own-key snapshot taken before validation callbacks run.
   * @returns Input issues in own-key order.
   */
  private static inputIssues(
    mapping: ITableMapping,
    input: object,
    keys: readonly PropertyKey[],
  ): ISchemaIssue[] {
    if (keys.length === 0) return [SqlWriteStatements.issue([], "empty_row")];
    const issues: ISchemaIssue[] = [];
    for (const key of keys) {
      if (typeof key !== "string") {
        issues.push(SqlWriteStatements.issue([], "unknown_property"));
      } else if (!Object.hasOwn(mapping.propertyToColumn, key)) {
        issues.push(SqlWriteStatements.issue([key], "unknown_property"));
      } else if (Reflect.get(input, key) === undefined) {
        issues.push(SqlWriteStatements.issue([key], "undefined_input"));
      }
    }
    return issues;
  }

  /**
   * Selects normalized insert columns while retaining omitted database-owned fields.
   * @param mapping Effective table columns in declaration order.
   * @param row Validated input and normalized values.
   * @returns Columns represented in the insert tuple.
   */
  private static insertColumns(mapping: ITableMapping, row: IWriteRow): readonly ITableColumn[] {
    return mapping.columns.filter(
      (column) =>
        row.values.has(column.property) &&
        (!column.isInsertOptional || row.supplied.has(column.property)),
    );
  }

  /**
   * Checks equality of ordered effective column sets.
   * @param first Reference columns in table declaration order.
   * @param second Candidate columns in table declaration order.
   * @returns True when both sequences contain the same properties.
   */
  private static sameColumns(
    first: readonly ITableColumn[],
    second: readonly ITableColumn[],
  ): boolean {
    return (
      first.length === second.length &&
      first.every((column, index) => column.property === second[index]?.property)
    );
  }

  /**
   * Creates an insert column list and row tuples without interpreting bound fragments as SQL.
   * @param columns Validated matching columns in table order.
   * @param rows Normalized rows in caller order.
   * @returns Immutable parameterized SQL fragment.
   */
  private static valuesFragment(
    columns: readonly ITableColumn[],
    rows: readonly IWriteRow[],
  ): SqlFragment {
    const strings: string[] = [];
    const values: SqlFragment[] = [];
    let text = `(${columns.map((column) => SqlIdentifiers.quote(column.column)).join(", ")}) values (`;
    for (const [rowIndex, row] of rows.entries()) {
      for (const [columnIndex, column] of columns.entries()) {
        strings.push(text);
        values.push(SqlFragment.parameter(row.values.get(column.property)));
        text = columnIndex === columns.length - 1 ? ")" : ", ";
      }
      if (rowIndex < rows.length - 1) text += ", (";
    }
    strings.push(text);
    return new SqlFragment(strings, values);
  }

  /**
   * Creates a comma-separated sequence of quoted assignments to bound normalized values.
   * @param columns Validated columns in table order.
   * @param value Snapshot of normalized schema values.
   * @returns Immutable parameterized assignment fragment.
   */
  private static setFragment(
    columns: readonly ITableColumn[],
    value: ReadonlyMap<string, unknown>,
  ): SqlFragment {
    const strings: string[] = [];
    const values: SqlFragment[] = [];
    for (const [index, column] of columns.entries()) {
      strings.push(`${index === 0 ? "" : ", "}${SqlIdentifiers.quote(column.column)} = `);
      values.push(SqlFragment.parameter(value.get(column.property)));
    }
    strings.push("");
    return new SqlFragment(strings, values);
  }

  /**
   * Prefixes row issues with their index only for multi-row inputs.
   * @param issues Issues emitted for one candidate row.
   * @param isBatch Whether the caller supplied a row sequence.
   * @param index Zero-based row index in that sequence.
   * @returns Issues with their row location preserved.
   */
  private static rowIssues(
    issues: readonly ISchemaIssue[],
    isBatch: boolean,
    index: number,
  ): readonly ISchemaIssue[] {
    return isBatch ? issues.map((issue) => ({ ...issue, path: [index, ...issue.path] })) : issues;
  }

  /**
   * Builds a typed write rejection without inventing a SQL fragment.
   * @param path Property or row location of the rejection.
   * @param reason Stable write-specific rejection reason.
   * @returns Rejected result containing one issue.
   */
  private static failure(path: readonly (string | number)[], reason: string): IResult<never> {
    return { ok: false, issues: [SqlWriteStatements.issue(path, reason)] };
  }

  /**
   * Describes one write-shape rejection using the schema issue contract.
   * @param path Property or row location of the rejection.
   * @param reason Stable write-specific rejection reason.
   * @returns Public typed issue without copying input values.
   */
  private static issue(path: readonly (string | number)[], reason: string): ISchemaIssue {
    return { path, code: "custom", message: `Invalid write input: ${reason}`, params: { reason } };
  }
}
