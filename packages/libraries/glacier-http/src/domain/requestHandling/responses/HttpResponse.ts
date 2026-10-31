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

/**
 * Validated transport envelope retained outside a response instance's enumerable state.
 * @template T Logical response body type associated with the envelope.
 */
interface IResponseEnvelope<T> {
  /** Logical DTO value awaiting declared-schema serialization. */
  readonly body: T;
  /** Selected successful HTTP status. */
  readonly status: number;
  /** Frozen validated response fields. */
  readonly headers: Readonly<Record<string, string | readonly string[]>>;
}

/**
 * Validated success envelope; DTO contents remain untrusted until declared-schema serialization.
 * @template T Object, object-array, or void body represented by this response.
 */
export class HttpResponse<T extends object | readonly object[] | void> {
  // Per-owner typing preserves T without casting an erased shared registry value back to T.
  /**
   * Private weak storage for this instance's immutable typed envelope.
   * @default New empty WeakMap per response instance
   */
  private readonly envelopes = new WeakMap<HttpResponse<T>, IResponseEnvelope<T>>();

  /**
   * Retrieves only the envelope registered to this response instance.
   * @returns The validated response envelope owned by this receiver.
   * @throws {TypeError} When this receiver has no registered response envelope.
   */
  private get envelope(): IResponseEnvelope<T> {
    const envelope = this.envelopes.get(this);
    if (envelope === undefined) throw new TypeError("Invalid response receiver");
    return envelope;
  }

  /**
   * Stores the logical DTO and frozen transport values after validating the private factory token.
   * @param token Module-private identity proving construction through a response factory.
   * @param body Logical DTO value retained for declared-schema serialization.
   * @param status Successful status selected for the response.
   * @param options Caller-supplied transport fields copied and validated here.
   * @throws {HttpContractError} When construction is attempted without the private factory token.
   */
  private constructor(token: symbol, body: T, status: number, options: IHttpResponseOptions) {
    if (token !== RESPONSE_CREATION) throw new HttpContractError("Use HttpResponse factories");
    const headers = HttpResponse.copyHeaders(options.headers);
    HttpResponse.appendCookies(headers, options.cookies);
    this.envelopes.set(this, { body, status, headers: Object.freeze(headers) });
    // The registry itself is not public output; its values are weakly held outside this instance.
    Object.defineProperty(this, "envelopes", { enumerable: false });
    Object.freeze(this);
  }

  /**
   * Validates and detaches caller-supplied response header fields.
   * @param supplied Optional header record to copy.
   * @returns Mutable normalized record for subsequent cookie assembly.
   */
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

  /**
   * Rejects transport-owned and repeated normalized response header names.
   * @param normalizedName Lower-case name being added.
   * @param headers Header record already populated by this copy operation.
   * @returns No value; rejects names that cannot be caller supplied.
   * @throws {TypeError} When the name is reserved or duplicates an existing field.
   */
  private static validateHeaderName(
    normalizedName: string,
    headers: Readonly<Record<string, string | readonly string[]>>,
  ): void {
    if (RESERVED_HEADERS.has(normalizedName) || Object.hasOwn(headers, normalizedName))
      throw new TypeError("Reserved or duplicate response header");
  }

  /**
   * Validates and snapshots one response header value or nonempty value list.
   * @param name Header name used for native value validation.
   * @param value String value or ordered list of string values.
   * @returns The validated string or a frozen copy of its values.
   * @throws {TypeError} When value is neither a string nor a nonempty string list.
   */
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

  /**
   * Appends validated cookie wire fields to the copied Set-Cookie response field.
   * @param headers Mutable copied header record receiving cookie fields.
   * @param supplied Optional response cookie list to append.
   * @returns No value; updates the supplied copied header record.
   * @throws {TypeError} When a supplied cookie is not an HttpCookie instance.
   */
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

  /**
   * Creates a JSON response envelope and snapshots its status and transport options.
   * @param body DTO object or readonly array of DTO objects; primitives are rejected.
   * @param options Optional fields and success status; defaults to empty options and status 200.
   * @returns A validated response retaining the body for schema-based serialization.
   * @throws {HttpContractError} When the body, status, headers, or cookies are invalid.
   */
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

  /**
   * Creates a bodyless 204 response and snapshots its transport options.
   * @param options Optional headers/cookies; omission adds no caller-supplied fields.
   * @returns A validated response with no body and status 204.
   * @throws {HttpContractError} When supplied headers or cookies are invalid.
   */
  public static noContent(options: IHttpResponseOptions = {}): HttpResponse<void> {
    try {
      return new HttpResponse<void>(RESPONSE_CREATION, undefined, 204, options);
    } catch (error: unknown) {
      throw new HttpContractError("Invalid HTTP bodyless response", { cause: error });
    }
  }

  /**
   * Exposes a detached envelope to the internal transport bridge, not as a public serializer.
   * @returns Body, status, and frozen headers for transport-side contract validation.
   */
  public [RESPONSE_WIRE](): {
    /** Logical DTO value awaiting declared-schema serialization. */
    readonly body: T;
    /** Successful status selected for the response. */
    readonly status: number;
    /** Frozen validated response fields. */
    readonly headers: Readonly<Record<string, string | readonly string[]>>;
  } {
    const { body, status, headers } = this.envelope;
    return { body, status, headers };
  }
}
