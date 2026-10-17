import type { ISchemaIssueCode } from "../failures/ISchemaIssueCode.js";

/** Why a value was rejected, before the field path and any decorator message override are applied. */
export interface IValueFailure {
  /** Stable code of the failure. */
  readonly code: ISchemaIssueCode;
  /** Default English message. */
  readonly message: string;
  /** Code-specific details. */
  readonly params: Readonly<Record<string, unknown>>;
}
