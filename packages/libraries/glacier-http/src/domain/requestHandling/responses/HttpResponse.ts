import { validateHeaderName, validateHeaderValue } from "node:http";
import type { IHttpResponseOptions } from "./types/IHttpResponseOptions.js";
import type { IHttpJsonResponseOptions } from "./types/IHttpJsonResponseOptions.js";
import { HttpCookie } from "./HttpCookie.js";
import { COOKIE_WIRE } from "./CookieWire.js";
import { RESPONSE_WIRE } from "./ResponseWire.js";
import { HttpContractError } from "./HttpContract.error.js";

const RESERVED_HEADERS = new Set([
  "content-type",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
  "trailer",
  "te",
  "upgrade",
  "proxy-connection",
  "x-request-id",
]);
const RESPONSE_CREATION = Symbol("validated response creation");

/** Validated success envelope. DTO contents remain untrusted until declared-schema serialization. */
export class HttpResponse<T extends object | readonly object[] | void> {
  readonly #body: T;
  readonly #status: number;
  readonly #headers: Readonly<Record<string, string | readonly string[]>>;

  /** Snapshots response transport values while retaining the logical DTO for schema processing. */
  private constructor(token: symbol, body: T, status: number, options: IHttpResponseOptions) {
    if (token !== RESPONSE_CREATION) throw new HttpContractError("Use HttpResponse factories");
    this.#body = body;
    this.#status = status;
    const headers: Record<string, string | readonly string[]> = Object.create(null);
    for (const [name, value] of Object.entries(
      options.headers === undefined ? {} : options.headers,
    )) {
      validateHeaderName(name);
      const normalizedName = name.toLowerCase();
      if (RESERVED_HEADERS.has(normalizedName) || Object.hasOwn(headers, normalizedName))
        throw new TypeError("Reserved or duplicate response header");
      const values = typeof value === "string" ? [value] : value;
      if (!Array.isArray(values) || values.length === 0)
        throw new TypeError("Invalid response header values");
      for (const field of values) {
        if (typeof field !== "string") throw new TypeError("Invalid response header value");
        validateHeaderValue(name, field);
      }
      headers[normalizedName] = typeof value === "string" ? value : Object.freeze([...values]);
    }
    const cookies = [...(options.cookies === undefined ? [] : options.cookies)];
    for (const cookie of cookies) {
      if (!(cookie instanceof HttpCookie)) throw new TypeError("Invalid response cookie");
    }
    if (cookies.length > 0) {
      const existing = headers["set-cookie"];
      const fields = typeof existing === "string" ? [existing] : [...(existing ?? [])];
      headers["set-cookie"] = Object.freeze([
        ...fields,
        ...cookies.map((cookie) => cookie[COOKIE_WIRE]()),
      ]);
    }
    this.#headers = Object.freeze(headers);
    Object.freeze(this);
  }

  /** Creates a JSON success value, rejecting primitives and invalid/bodyless status codes. */
  public static json<T extends object | readonly object[]>(
    body: T,
    options: IHttpJsonResponseOptions = {},
  ): HttpResponse<T> {
    try {
      const status: number = options.status === undefined ? 200 : options.status;
      if (
        !Number.isInteger(status) ||
        status < 200 ||
        status > 299 ||
        status === 204 ||
        status === 205
      )
        throw new TypeError("Invalid JSON success status");
      if (typeof body !== "object" || body === null)
        throw new TypeError("JSON response requires DTO objects");
      return new HttpResponse(RESPONSE_CREATION, body, status, options);
    } catch (error: unknown) {
      throw new HttpContractError("Invalid HTTP JSON response", { cause: error });
    }
  }

  /** Creates an explicitly bodyless 204 response with validated transport options. */
  public static noContent(options: IHttpResponseOptions = {}): HttpResponse<void> {
    try {
      return new HttpResponse<void>(RESPONSE_CREATION, undefined, 204, options);
    } catch (error: unknown) {
      throw new HttpContractError("Invalid HTTP bodyless response", { cause: error });
    }
  }

  /** Internal detached envelope view; transport still validates origin and declared body contract. */
  public [RESPONSE_WIRE](): {
    readonly body: T;
    readonly status: number;
    readonly headers: Readonly<Record<string, string | readonly string[]>>;
  } {
    return { body: this.#body, status: this.#status, headers: this.#headers };
  }
}
