import type { IHttpResponseOptions } from "./IHttpResponseOptions.js";
import type { IHttpSuccessStatus } from "./IHttpSuccessStatus.js";

/** JSON defaults to 200; no bodyless status can be selected. */
export interface IHttpJsonResponseOptions extends IHttpResponseOptions {
  /** JSON success status; bodyless statuses are not accepted.
   * @default 200
   */
  readonly status?: Exclude<IHttpSuccessStatus, 204 | 205>;
}
