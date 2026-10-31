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

/** Exact generic envelope type, retained outside the response's enumerable state. */
interface IResponseEnvelope<T> {
  readonly body: T;
  readonly status: number;
  readonly headers: Readonly<Record<string, string | readonly string[]>>;
}

/** Validated success envelope. DTO contents remain untrusted until declared-schema serialization. */
export class HttpResponse<T extends object | readonly object[] | void> {
  // Per-owner typing preserves T without casting an erased shared registry value back to T.
  private readonly envelopes = new WeakMap<HttpResponse<T>, IResponseEnvelope<T>>();

  /** Resolves only a validated owner's envelope, never a fabricated or inherited response. */
  private get envelope(): IResponseEnvelope<T> {
    const envelope = this.envelopes.get(this);
    if (envelope === undefined) throw new TypeError("Invalid response receiver");
    return envelope;
  }

  /** Snapshots response transport values while retaining the logical DTO for schema processing. */
  private constructor(token: symbol, body: T, status: number, options: IHttpResponseOptions) {
    if (token !== RESPONSE_CREATION) throw new HttpContractError("Use HttpResponse factories");
    const headers = HttpResponse.copyHeaders(options.headers);
    HttpResponse.appendCookies(headers, options.cookies);
    this.envelopes.set(this, { body, status, headers: Object.freeze(headers) });
    // The registry itself is not public output; its values are weakly held outside this instance.
    Object.defineProperty(this, "envelopes", { enumerable: false });
    Object.freeze(this);
  }

  private static copyHeaders(
    supplied: IHttpResponseOptions["headers"],
  ): Record<string, string | readonly string[]> {
    const headers: Record<string, string | readonly string[]> = Object.create(null);
    for (const [name, value] of Object.entries(supplied === undefined ? {} : supplied)) {
      validateHeaderName(name);
      const normalizedName = name.toLowerCase();
      HttpResponse.validateHeaderName(normalizedName, headers);
      headers[normalizedName] = HttpResponse.copyHeaderValue(name, value);
    }
    return headers;
  }

  private static validateHeaderName(
    normalizedName: string,
    headers: Readonly<Record<string, string | readonly string[]>>,
  ): void {
    if (RESERVED_HEADERS.has(normalizedName) || Object.hasOwn(headers, normalizedName))
      throw new TypeError("Reserved or duplicate response header");
  }

  private static copyHeaderValue(
    name: string,
    value: string | readonly string[],
  ): string | readonly string[] {
    if (typeof value === "string") {
      validateHeaderValue(name, value);
      return value;
    }
    if (!Array.isArray(value) || value.length === 0)
      throw new TypeError("Invalid response header values");
    const fields = value.map((field) => {
      if (typeof field !== "string") throw new TypeError("Invalid response header value");
      validateHeaderValue(name, field);
      return field;
    });
    return Object.freeze(fields);
  }

  private static appendCookies(
    headers: Record<string, string | readonly string[]>,
    supplied: IHttpResponseOptions["cookies"],
  ): void {
    const cookies = [...(supplied === undefined ? [] : supplied)];
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
    const { body, status, headers } = this.envelope;
    return { body, status, headers };
  }
}
