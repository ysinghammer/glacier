import type { IHttpCookieOptions } from "./IHttpCookieOptions.js";
import type { IHttpClearCookieOptions } from "./IHttpClearCookieOptions.js";
import { COOKIE_WIRE } from "./CookieWire.js";

const COOKIE_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const COOKIE_VALUE =
  /^(?:[\x21\x23-\x2b\x2d-\x3a\x3c-\x5b\x5d-\x7e]*|"[\x21\x23-\x2b\x2d-\x3a\x3c-\x5b\x5d-\x7e]*")$/;
const COOKIE_PATH = /^[\x20-\x3a\x3c-\x7e]+$/;
const COOKIE_DOMAIN =
  /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*$/;
const CLEAR_EXPIRY = "Thu, 01 Jan 1970 00:00:00 GMT";
const COOKIE_CREATION = Symbol("validated cookie creation");

/** Immutable validated cookie field; factories never encode opaque values. */
export class HttpCookie {
  readonly #wire: string;

  /** Stores a validated field; consumers cannot construct arbitrary cookie instances. */
  private constructor(token: symbol, wire: string) {
    if (token !== COOKIE_CREATION) throw new TypeError("Use HttpCookie factories");
    this.#wire = wire;
    Object.freeze(this);
  }

  /** Validates syntax/security attributes and snapshots mutable Date values without retaining them. */
  public static set(name: string, value: string, options: IHttpCookieOptions = {}): HttpCookie {
    const attributes = HttpCookie.#attributes(name, value, options);
    if (options.maxAge !== undefined) {
      if (!Number.isSafeInteger(options.maxAge)) throw new TypeError("Invalid cookie age");
      attributes.push(`Max-Age=${options.maxAge}`);
    }
    if (options.expires !== undefined) {
      const time = Date.prototype.getTime.call(options.expires);
      if (!Number.isFinite(time)) throw new TypeError("Invalid cookie expiry");
      attributes.push(`Expires=${new Date(time).toUTCString()}`);
    }
    return new HttpCookie(COOKIE_CREATION, attributes.join("; "));
  }

  /** Emits immediate expiry and Max-Age=0 with the caller's matching scope/security attributes. */
  public static clear(name: string, options: IHttpClearCookieOptions = {}): HttpCookie {
    const attributes = HttpCookie.#attributes(name, "", options);
    attributes.push("Max-Age=0", `Expires=${CLEAR_EXPIRY}`);
    return new HttpCookie(COOKIE_CREATION, attributes.join("; "));
  }

  /** Internal transport bridge, inaccessible through a public package export. */
  public [COOKIE_WIRE](): string {
    return this.#wire;
  }

  /** Builds safe attributes and enforces cookie prefixes before any field is emitted. */
  static #attributes(name: string, value: string, options: IHttpCookieOptions): string[] {
    if (typeof name !== "string" || !COOKIE_NAME.test(name))
      throw new TypeError("Invalid cookie name");
    if (typeof value !== "string" || !COOKIE_VALUE.test(value))
      throw new TypeError("Invalid cookie value");
    const path = options.path === undefined ? "/" : options.path;
    const secure = options.secure === undefined ? true : options.secure;
    const httpOnly = options.httpOnly === undefined ? true : options.httpOnly;
    const sameSite = options.sameSite === undefined ? "lax" : options.sameSite;
    if (typeof path !== "string" || !COOKIE_PATH.test(path))
      throw new TypeError("Invalid cookie path");
    if (typeof secure !== "boolean" || typeof httpOnly !== "boolean")
      throw new TypeError("Invalid cookie flags");
    if (!["strict", "lax", "none"].includes(sameSite))
      throw new TypeError("Invalid cookie SameSite");
    if (sameSite === "none" && !secure) throw new TypeError("SameSite=None requires Secure");
    if (name.startsWith("__Secure-") && !secure)
      throw new TypeError("Secure prefix requires Secure");
    if (name.startsWith("__Host-") && (!secure || path !== "/" || options.domain !== undefined))
      throw new TypeError("Invalid Host prefix");
    const attributes = [`${name}=${value}`, `Path=${path}`];
    if (options.domain !== undefined) {
      if (typeof options.domain !== "string" || !COOKIE_DOMAIN.test(options.domain))
        throw new TypeError("Invalid cookie domain");
      attributes.push(`Domain=${options.domain}`);
    }
    if (secure) attributes.push("Secure");
    if (httpOnly) attributes.push("HttpOnly");
    attributes.push(`SameSite=${sameSite[0]?.toUpperCase()}${sameSite.slice(1)}`);
    return attributes;
  }
}
