import type { IHttpQueryValue } from "./IHttpQueryValue.js";

/** Recursively detached, readonly query records; no prototype-related keys are admitted. */
export interface IHttpQueryObject {
  readonly [name: string]: IHttpQueryValue;
}
