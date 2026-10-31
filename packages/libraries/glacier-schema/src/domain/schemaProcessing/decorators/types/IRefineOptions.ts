import type { IIssueCode } from "../../failures/IIssueCode.js";

/** Options of the class-level `Refine` decorator. */
export interface IRefineOptions {
  /**
   * Issue location using input keys, including `Rename` aliases.
   * @default []
   */
  readonly path?: readonly (string | number)[];
  /**
   * Stable issue code for the failed refinement.
   * @default "custom"
   */
  readonly code?: IIssueCode;
  /**
   * Message used when the refinement rejects.
   * @default "Refinement failed"
   */
  readonly message?: string;
}
