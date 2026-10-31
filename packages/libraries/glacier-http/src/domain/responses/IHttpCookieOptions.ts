/** RFC-safe attributes; defaults are secure, HttpOnly, SameSite=Lax and Path=/. */
export interface IHttpCookieOptions {
  readonly path?: string;
  readonly domain?: string;
  readonly maxAge?: number;
  readonly expires?: Date;
  readonly secure?: boolean;
  readonly httpOnly?: boolean;
  readonly sameSite?: "strict" | "lax" | "none";
}
