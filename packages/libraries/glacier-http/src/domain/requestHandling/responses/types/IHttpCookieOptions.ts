/** RFC-safe attributes; defaults are secure, HttpOnly, SameSite=Lax and Path=/. */
export interface IHttpCookieOptions {
  /** Cookie path for scoping; omitted path uses `/`.
   * @default /
   */
  readonly path?: string;
  /** Optional validated domain attribute. */
  readonly domain?: string;
  /** Optional integer Max-Age in seconds; negative values expire the cookie. */
  readonly maxAge?: number;
  /** Optional absolute expiry; factories snapshot the date value. */
  readonly expires?: Date;
  /** Whether to emit Secure.
   * @default true
   */
  readonly secure?: boolean;
  /** Whether to emit HttpOnly.
   * @default true
   */
  readonly httpOnly?: boolean;
  /** SameSite policy.
   * @default lax
   */
  readonly sameSite?: "strict" | "lax" | "none";
}
