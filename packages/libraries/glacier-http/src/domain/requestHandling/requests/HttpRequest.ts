import type { IHttpQueryObject } from "./types/IHttpQueryObject.js";
import type { IHttpRequestHeaders } from "./types/IHttpRequestHeaders.js";
import type { IHttpRequestCookies } from "./types/IHttpRequestCookies.js";
import { REQUEST_CREATION } from "./RequestCreation.js";

/** Detached normalized transport data, supplied only by the server to approved hooks/binders. */
export class HttpRequest {
  readonly requestId: string;
  readonly method: string;
  readonly url: string;
  readonly pathname: string;
  readonly route: string | undefined;
  readonly params: Readonly<Record<string, string>>;
  readonly query: IHttpQueryObject;
  readonly remoteAddress: string | undefined;
  readonly signal: AbortSignal;
  readonly headers: IHttpRequestHeaders;
  readonly cookies: IHttpRequestCookies;
  readonly #brand = true;

  /** Copies normalized data; private construction prevents caller-supplied raw transport state. */
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
    void this.#brand;
    Object.freeze(this);
  }

  /** Internal server-only construction, keyed by a non-public symbol rather than a test escape hatch. */
  public static [REQUEST_CREATION](data: IRequestData): HttpRequest {
    return new HttpRequest(REQUEST_CREATION, data);
  }
}

/** Normalization output without mutable incoming-message or response handles. */
interface IRequestData {
  readonly requestId: string;
  readonly method: string;
  readonly url: string;
  readonly pathname: string;
  readonly route: string | undefined;
  readonly params: Readonly<Record<string, string>>;
  readonly query: IHttpQueryObject;
  readonly remoteAddress: string | undefined;
  readonly signal: AbortSignal;
  readonly headers: IHttpRequestHeaders;
  readonly cookies: IHttpRequestCookies;
}
