import type { IHttpRequestCookies } from "./IHttpRequestCookies.js";
import type { IRequestNormalizationResult } from "./IRequestNormalizationResult.js";

const COOKIE_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const COOKIE_VALUE =
  /^(?:[\x21\x23-\x2b\x2d-\x3a\x3c-\x5b\x5d-\x7e]*|"[\x21\x23-\x2b\x2d-\x3a\x3c-\x5b\x5d-\x7e]*")$/;

/** Strict opaque cookie lookup with duplicate-name rejection across all Cookie fields. */
export class RequestCookies implements IHttpRequestCookies {
  readonly #values: ReadonlyMap<string, string>;

  /** Stores only detached validated pairs, with no public mutation operations. */
  private constructor(values: ReadonlyMap<string, string>) {
    this.#values = values;
    Object.freeze(this);
  }

  /** Splits on the first equals, retaining empty and opaque values without decoding. */
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

  /** Returns the unmodified value, or undefined for an absent name. */
  public get(name: string): string | undefined {
    return this.#values.get(name);
  }
}
