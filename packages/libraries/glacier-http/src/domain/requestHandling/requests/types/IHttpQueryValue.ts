import type { IHttpQueryObject } from "./IHttpQueryObject.js";

/** Queries support scalars, repeated scalar arrays and nested records, never object arrays. */
export type IHttpQueryValue = string | readonly string[] | IHttpQueryObject;
