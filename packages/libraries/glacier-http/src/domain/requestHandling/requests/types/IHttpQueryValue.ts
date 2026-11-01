import type { IHttpQueryObject } from "./IHttpQueryObject.js";

/**
 * Query value grammar: scalar text, repeated scalar text, or nested records; arrays of objects are excluded.
 */
export type IHttpQueryValue = string | readonly string[] | IHttpQueryObject;
