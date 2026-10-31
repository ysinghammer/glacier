import type { IHttpInputIssue } from "../../requests/types/IHttpInputIssue.js";

/** RFC 9457 public error representation, with value-free input issues and correlation only. */
export interface IHttpProblem {
  /** Problem type URI.
   * @default about:blank
   */
  readonly type: string;
  /** Short public summary of the problem category. */
  readonly title: string;
  /** HTTP error status from 400 through 599. */
  readonly status: number;
  /** Safe public explanation that does not expose internal exception data. */
  readonly detail: string;
  /** Optional request correlation identifier. */
  readonly requestId?: string;
  /** Optional value-free validation issues for rejected request input. */
  readonly issues?: readonly IHttpInputIssue[];
}
