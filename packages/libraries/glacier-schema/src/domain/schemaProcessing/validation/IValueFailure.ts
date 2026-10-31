import type { IIssueCode } from "../failures/IIssueCode.js";

/** Why a value was rejected, before the field path and any decorator message override are applied. */
export interface IValueFailure {
  /** Stable code of the failure. */
  readonly code: IIssueCode;
  /** Default English message. */
  readonly message: string;
  /** Code-specific details. */
  readonly params: Readonly<Record<string, unknown>>;
  /** Location inside the field's value, such as an array index; absent when the value itself failed. */
  readonly path?: readonly (string | number)[];
  /** Set when the message already comes from a nested class and must not be replaced by the field's message. */
  readonly hasOwnMessage?: true;
}
