import type { ISchemaIssue } from "./ISchemaIssue.js";

/**
 * Typed discriminated outcome of `safeParse`: accepted value or the issues found.
 * @template T Type produced by successful parsing.
 * @property value Parsed instance when `ok` is true.
 * @property issues All validation failures when `ok` is false.
 */
export type IResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly ISchemaIssue[] };
