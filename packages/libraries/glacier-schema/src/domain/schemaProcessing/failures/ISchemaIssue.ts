import type { IIssueCode } from "./IIssueCode.js";

/** One validation failure located by the property path from the parsed class to the offending value. */
export interface ISchemaIssue {
  /** Property names and array indices from the root; empty for a failure of the root input. */
  readonly path: readonly (string | number)[];
  /** Stable code identifying the kind of failure. */
  readonly code: IIssueCode;
  /** Human-readable English message, or the decorator's `message` override. */
  readonly message: string;
  /** Code-specific details such as `expected` and `received`. */
  readonly params: Readonly<Record<string, unknown>>;
}
