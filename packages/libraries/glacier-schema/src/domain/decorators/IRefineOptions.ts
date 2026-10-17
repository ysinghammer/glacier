import type { IIssueCode } from "../failures/IIssueCode.js";

/** Options of the class-level `Refine` decorator. */
export interface IRefineOptions {
  /** Location of the issue, using input keys (`Rename` aliases); the root by default. */
  readonly path?: readonly (string | number)[];
  /** Issue code; `custom` by default. */
  readonly code?: IIssueCode;
  /** Issue message; `Refinement failed` by default. */
  readonly message?: string;
}
