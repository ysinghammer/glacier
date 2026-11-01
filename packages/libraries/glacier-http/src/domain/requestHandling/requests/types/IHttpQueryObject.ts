import type { IHttpQueryValue } from "./IHttpQueryValue.js";

/** Recursively detached, readonly query records; no prototype-related keys are admitted. */
export interface IHttpQueryObject {
  /** Query key mapped to a scalar, repeated scalar list, or nested object. */
  readonly [name: string]: IHttpQueryValue;
}
