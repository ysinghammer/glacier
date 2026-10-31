import type { IHttpInputIssue } from "../requests/IHttpInputIssue.js";

/** RFC 9457 public error representation, with value-free input issues and correlation only. */
export interface IHttpProblem {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly requestId?: string;
  readonly issues?: readonly IHttpInputIssue[];
}
