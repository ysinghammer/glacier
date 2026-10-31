import type { IHttpCookieOptions } from "./types/IHttpCookieOptions.js";
import type { IHttpClearCookieOptions } from "./types/IHttpClearCookieOptions.js";
import { COOKIE_WIRE } from "./CookieWire.js";
import { HttpContractError } from "./HttpContract.error.js";

const COOKIE_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const COOKIE_VALUE =
  /^(?:[\x21\x23-\x2b\x2d-\x3a\x3c-\x5b\x5d-\x7e]*|"[\x21\x23-\x2b\x2d-\x3a\x3c-\x5b\x5d-\x7e]*")$/;
const COOKIE_PATH = /^[\x20-\x3a\x3c-\x7e]+$/;
const COOKIE_DOMAIN =
  /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*$/;
const CLEAR_EXPIRY = "Thu, 01 Jan 1970 00:00:00 GMT";
const COOKIE_CREATION = Symbol("validated cookie creation");

// Full cookie fields contain opaque credentials and must not enter JSON or diagnostic enumeration.
const COOKIE_FIELDS = new WeakMap<HttpCookie, string>();

/** Immutable validated cookie field; factories never encode opaque values. */
export class HttpCookie {
  /**
   * Retrieves the serialized field from private weak storage without exposing its value.
   * @returns The validated cookie field string owned by this receiver.
   * @throws {TypeError} When this receiver has no entry in the private field registry.
   */
  private get wire(): string {
    const wire = COOKIE_FIELDS.get(this);
    if (wire === undefined) throw new TypeError("Invalid cookie receiver");
    return wire;
  }

  /**
   * Stores a validated cookie field after checking the module-private factory token.
   * @param token Module-private identity proving construction through a factory.
   * @param wire Validated serialized cookie field.
   * @throws {HttpContractError} When construction is attempted without the private factory token.
   */
  private constructor(token: symbol, wire: string) {
    if (token !== COOKIE_CREATION) throw new HttpContractError("Use HttpCookie factories");
    COOKIE_FIELDS.set(this, wire);
    Object.freeze(this);
  }

  /**
   * Creates a cookie field after validating syntax, security attributes, and expiry values.
   * @param name Cookie name to emit.
   * @param value Opaque cookie value; this factory does not encode it.
   * @param options Optional attributes; defaults use secure, HttpOnly, and SameSite=Lax.
   * @returns An immutable cookie value suitable for an HttpResponse factory.
   * @throws {HttpContractError} When the name, value, attributes, age, or expiry is invalid.
   */
  public static set(name: string, value: string, options: IHttpCookieOptions = {}): HttpCookie {
    try {
      const attributes = HttpCookie.attributes(name, value, options);
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
    } catch (error: unknown) {
      throw new HttpContractError("Invalid HTTP cookie", { cause: error });
    }
  }

  /**
   * Creates an immediately expired cookie while preserving caller-selected scope attributes.
   * @param name Cookie name to clear.
   * @param options Optional matching attributes; omitted options use an empty record.
   * @returns An immutable cookie field with Max-Age zero and a past expiry.
   * @throws {HttpContractError} When the name or supplied attributes are invalid.
   */
  public static clear(name: string, options: IHttpClearCookieOptions = {}): HttpCookie {
    try {
      const attributes = HttpCookie.attributes(name, "", options);
      attributes.push("Max-Age=0", `Expires=${CLEAR_EXPIRY}`);
      return new HttpCookie(COOKIE_CREATION, attributes.join("; "));
    } catch (error: unknown) {
      throw new HttpContractError("Invalid HTTP cookie clearing", { cause: error });
    }
  }

  /**
   * Returns the validated field for internal response assembly.
   * @returns The complete serialized cookie field; callers must not log its value.
   */
  public [COOKIE_WIRE](): string {
    return this.wire;
  }

  /**
   * Builds ordered cookie attributes and enforces prefix requirements before serialization.
   * @param name Cookie name being emitted.
   * @param value Opaque cookie value being emitted.
   * @param options Caller-supplied path, domain, and security attributes.
   * @returns Cookie name/value and validated attributes in wire order.
   */
  private static attributes(name: string, value: string, options: IHttpCookieOptions): string[] {
    HttpCookie.validateNameValue(name, value);
    const path = options.path === undefined ? "/" : options.path;
    const secure = options.secure === undefined ? true : options.secure;
    const httpOnly = options.httpOnly === undefined ? true : options.httpOnly;
    const sameSite = options.sameSite === undefined ? "lax" : options.sameSite;
    HttpCookie.validateFlags(name, path, secure, httpOnly, sameSite, options.domain);
    const attributes = [`${name}=${value}`, `Path=${path}`];
    HttpCookie.appendDomain(attributes, options.domain);
    if (secure) attributes.push("Secure");
    if (httpOnly) attributes.push("HttpOnly");
    attributes.push(`SameSite=${sameSite[0]?.toUpperCase()}${sameSite.slice(1)}`);
    return attributes;
  }

  /**
   * Validates the cookie name and opaque cookie-value wire syntax.
   * @param name Name to validate against the cookie token grammar.
   * @param value Value to validate without decoding or transformation.
   * @returns No value; confirms both fields are safe to serialize.
   * @throws {TypeError} When either field violates the cookie wire grammar.
   */
  private static validateNameValue(name: string, value: string): void {
    if (typeof name !== "string" || !COOKIE_NAME.test(name))
      throw new TypeError("Invalid cookie name");
    if (typeof value !== "string" || !COOKIE_VALUE.test(value))
      throw new TypeError("Invalid cookie value");
  }

  /**
   * Validates path and security flags, including SameSite and cookie-prefix constraints.
   * @param name Cookie name whose prefixes impose attribute requirements.
   * @param path Cookie path attribute.
   * @param secure Whether the Secure attribute is enabled.
   * @param httpOnly Whether the HttpOnly attribute is enabled.
   * @param sameSite Selected SameSite policy.
   * @param domain Optional domain attribute.
   * @returns No value; confirms attributes satisfy cookie policy.
   * @throws {TypeError} When attributes conflict or violate the supported policy.
   */
  private static validateFlags(
    name: string,
    path: string,
    secure: boolean,
    httpOnly: boolean,
    sameSite: string,
    domain: string | undefined,
  ): void {
    if (typeof path !== "string" || !COOKIE_PATH.test(path))
      throw new TypeError("Invalid cookie path");
    if (typeof secure !== "boolean" || typeof httpOnly !== "boolean")
      throw new TypeError("Invalid cookie flags");
    if (!["strict", "lax", "none"].includes(sameSite))
      throw new TypeError("Invalid cookie SameSite");
    if (sameSite === "none" && !secure) throw new TypeError("SameSite=None requires Secure");
    if (name.startsWith("__Secure-") && !secure)
      throw new TypeError("Secure prefix requires Secure");
    if (name.startsWith("__Host-") && (!secure || path !== "/" || domain !== undefined))
      throw new TypeError("Invalid Host prefix");
  }

  /**
   * Validates and appends the optional cookie domain attribute.
   * @param attributes Ordered cookie attributes receiving the domain when supplied.
   * @param domain Optional domain string to append.
   * @returns No value; mutates the local attribute list only when a domain is present.
   * @throws {TypeError} When the supplied domain violates the accepted hostname grammar.
   */
  private static appendDomain(attributes: string[], domain: string | undefined): void {
    if (domain !== undefined) {
      if (typeof domain !== "string" || !COOKIE_DOMAIN.test(domain))
        throw new TypeError("Invalid cookie domain");
      attributes.push(`Domain=${domain}`);
    }
  }
}
