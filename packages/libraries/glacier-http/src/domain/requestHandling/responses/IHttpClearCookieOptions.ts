import type { IHttpCookieOptions } from "./IHttpCookieOptions.js";

/** Clearing owns Max-Age and Expires; other attributes must match the original cookie. */
export type IHttpClearCookieOptions = Omit<IHttpCookieOptions, "maxAge" | "expires">;
