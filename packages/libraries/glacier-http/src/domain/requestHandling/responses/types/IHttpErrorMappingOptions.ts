import type { IHttpErrorStatus } from "./IHttpErrorStatus.js";

/** Static public Problem Details; exception values are never interpolated. */
export interface IHttpErrorMappingOptions {
  readonly status: IHttpErrorStatus;
  readonly title: string;
  readonly detail?: string;
  readonly type?: string;
}
