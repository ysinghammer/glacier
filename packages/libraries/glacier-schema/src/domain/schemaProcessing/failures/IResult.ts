import type { ISchemaIssue } from "./ISchemaIssue.js";

/** Typed discriminated outcome of `safeParse`: the parsed instance or every issue found. */
export type IResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly ISchemaIssue[] };
