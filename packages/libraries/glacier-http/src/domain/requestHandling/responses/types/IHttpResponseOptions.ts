import type { HttpCookie } from "../HttpCookie.js";

/** Caller-owned transport fields are snapshotted and validated by response factories. */
export interface IHttpResponseOptions {
  /** Optional response fields; names and values are validated and copied by the factory.
   * @default Empty record
   */
  readonly headers?: Readonly<Record<string, string | readonly string[]>>;
  /** Optional validated cookie fields appended to the response.
   * @default Empty list
   */
  readonly cookies?: readonly HttpCookie[];
}
