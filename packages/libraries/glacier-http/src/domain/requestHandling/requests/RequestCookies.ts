import type { IHttpRequestCookies } from "./types/IHttpRequestCookies.js";
import type { IRequestNormalizationResult } from "./types/IRequestNormalizationResult.js";

const COOKIE_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const COOKIE_VALUE =
  /^(?:[\x21\x23-\x2b\x2d-\x3a\x3c-\x5b\x5d-\x7e]*|"[\x21\x23-\x2b\x2d-\x3a\x3c-\x5b\x5d-\x7e]*")$/;

// Request cookie credentials are available only through the declared lookup and binding operations.
const REQUEST_COOKIE_VALUES = new WeakMap<RequestCookies, ReadonlyMap<string, string>>();

/** Strict opaque cookie lookup with duplicate-name rejection across all Cookie fields. */
export class RequestCookies implements IHttpRequestCookies {
  /**
   * Retrieves the receiver's private cookie map without exposing credential fields.
   * @returns The validated detached cookie name/value map.
   * @throws {TypeError} When the receiver has no entry in the private field registry.
   */
  private get values(): ReadonlyMap<string, string> {
    const values = REQUEST_COOKIE_VALUES.get(this);
    if (values === undefined) throw new TypeError("Invalid request cookie receiver");
    return values;
  }

  /**
   * Stores validated detached cookie pairs and freezes this lookup object.
   * @param values Validated case-sensitive cookie names and opaque values.
   */
  private constructor(values: ReadonlyMap<string, string>) {
    REQUEST_COOKIE_VALUES.set(this, values);
    Object.freeze(this);
  }

  /**
   * Parses cookie fields, rejecting malformed syntax and duplicate names across fields.
   * @param fields Raw Cookie field values from the request.
   * @returns A detached lookup, or status 400 when any pair is invalid.
   */
  public static parse(fields: readonly string[]): IRequestNormalizationResult<RequestCookies> {
    const values = new Map<string, string>();
    for (const field of fields) {
      for (const item of field.split(";")) {
        const cookie = item.trim();
        const separator = cookie.indexOf("=");
        if (separator < 1) return { ok: false, status: 400 };
        const name = cookie.slice(0, separator);
        const value = cookie.slice(separator + 1);
        if (!COOKIE_NAME.test(name) || !COOKIE_VALUE.test(value) || values.has(name))
          return { ok: false, status: 400 };
        values.set(name, value);
      }
    }
    return { ok: true, value: new RequestCookies(values) };
  }

  /**
   * Looks up a cookie by its case-sensitive name without decoding its value.
   * @param name Exact cookie name to retrieve.
   * @returns The original value, including empty strings, or undefined when absent.
   */
  public get(name: string): string | undefined {
    return this.values.get(name);
  }

  /**
   * Copies opaque cookie pairs to a frozen record for explicit DTO binding.
   * @returns Detached cookie values without decoding or mutation operations.
   */
  public toRecord(): Readonly<Record<string, string>> {
    return Object.freeze(Object.fromEntries(this.values));
  }
}
