import type { IHttpErrorStatus } from "./IHttpErrorStatus.js";

/** Static public Problem Details; exception values are never interpolated. */
export interface IHttpErrorMappingOptions {
  /** Public HTTP error status for the mapped error. */
  readonly status: IHttpErrorStatus;
  /** Static public title; exception messages are not substituted. */
  readonly title: string;
  /** Optional static public detail; omitted detail uses the mapping title.
   * @default Mapping title
   */
  readonly detail?: string;
  /** Optional Problem Details type URI.
   * @default about:blank
   */
  readonly type?: string;
}
