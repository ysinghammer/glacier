import type { ISchemaIssueCode } from "./ISchemaIssueCode.js";

/** The code of an issue: a stable built-in code, or any string a class-level `Refine` configured. */
export type IIssueCode = ISchemaIssueCode | (string & Record<never, never>);
