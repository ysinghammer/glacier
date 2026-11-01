import type { IHttpQueryObject } from "./types/IHttpQueryObject.js";
import type { IHttpRequestHeaders } from "./types/IHttpRequestHeaders.js";
import type { IHttpRequestCookies } from "./types/IHttpRequestCookies.js";
import { REQUEST_CREATION } from "./RequestCreation.js";

/** Detached normalized transport data, supplied only by the server to approved hooks/binders. */
export class HttpRequest {
  /** Unique correlation identifier assigned for the request lifecycle. */
  public readonly requestId: string;
  /** Received HTTP method. */
  public readonly method: string;
  /** Original request URL retained for approved request consumers. */
  public readonly url: string;
  /** Decoded pathname without the query string. */
  public readonly pathname: string;
  /** Matched route template, or undefined before a route is selected. */
  public readonly route: string | undefined;
  /** Decoded path parameter values keyed by route parameter name. */
  public readonly params: Readonly<Record<string, string>>;
  /** Detached query values with nested records and repeated scalar lists. */
  public readonly query: IHttpQueryObject;
  /** Remote peer address when the transport supplies one. */
  public readonly remoteAddress: string | undefined;
  /** Signal aborted when the peer disconnects or request processing is cancelled. */
  public readonly signal: AbortSignal;
  /** Detached normalized header lookup; credentials remain opaque. */
  public readonly headers: IHttpRequestHeaders;
  /** Detached opaque cookie lookup; values remain undecoded. */
  public readonly cookies: IHttpRequestCookies;
  /** Compile-time brand preventing structural construction outside this module. */
  declare private readonly brand: true;

  /**
   * Copies normalized data and freezes the request; only the private server token permits construction.
   * @param token Module-private construction identity.
   * @param data Detached normalized request fields.
   * @throws {TypeError} When the supplied token is not the module's request-creation identity.
   */
  private constructor(token: symbol, data: IRequestData) {
    if (token !== REQUEST_CREATION) throw new TypeError("Requests are server-created");
    this.requestId = data.requestId;
    this.method = data.method;
    this.url = data.url;
    this.pathname = data.pathname;
    this.route = data.route;
    this.params = data.params;
    this.query = data.query;
    this.remoteAddress = data.remoteAddress;
    this.signal = data.signal;
    this.headers = data.headers;
    this.cookies = data.cookies;
    void this.brand;
    Object.freeze(this);
  }

  /**
   * Creates the detached request for the server using its private module token.
   * @param data Normalized fields produced by request handling.
   * @returns A frozen request object containing the supplied detached fields.
   */
  public static [REQUEST_CREATION](data: IRequestData): HttpRequest {
    return new HttpRequest(REQUEST_CREATION, data);
  }
}

/**
 * Normalized request fields required to create an HttpRequest, without mutable transport handles.
 */
interface IRequestData {
  /** Request correlation identifier. */
  readonly requestId: string;
  /** Received HTTP method. */
  readonly method: string;
  /** Original request URL string. */
  readonly url: string;
  /** Decoded pathname without query data. */
  readonly pathname: string;
  /** Matched route template or undefined before matching. */
  readonly route: string | undefined;
  /** Detached path parameter values keyed by route parameter name. */
  readonly params: Readonly<Record<string, string>>;
  /** Detached normalized query object. */
  readonly query: IHttpQueryObject;
  /** Remote peer address when available. */
  readonly remoteAddress: string | undefined;
  /** Request cancellation and disconnect signal. */
  readonly signal: AbortSignal;
  /** Normalized detached header lookup. */
  readonly headers: IHttpRequestHeaders;
  /** Normalized detached cookie lookup. */
  readonly cookies: IHttpRequestCookies;
}
