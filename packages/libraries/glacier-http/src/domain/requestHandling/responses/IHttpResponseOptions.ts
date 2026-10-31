import type { HttpCookie } from "./HttpCookie.js";

/** Caller-owned transport fields are snapshotted and validated by response factories. */
export interface IHttpResponseOptions {
  readonly headers?: Readonly<Record<string, string | readonly string[]>>;
  readonly cookies?: readonly HttpCookie[];
}
