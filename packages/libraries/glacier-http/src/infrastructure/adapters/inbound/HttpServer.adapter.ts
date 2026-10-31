import { createServer, STATUS_CODES } from "node:http";
import type { IncomingMessage, ServerResponse, Server } from "node:http";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { Schema } from "@glacier/schema";
import { PreparedRoutes } from "../../../application/PreparedRoutes.js";
import { HttpRequest } from "../../../domain/requests/HttpRequest.js";
import { REQUEST_CREATION } from "../../../domain/requests/RequestCreation.js";
import { RequestTarget } from "../../../domain/requests/RequestTarget.js";
import { RequestHeaders } from "../../../domain/requests/RequestHeaders.js";
import { RequestCookies } from "../../../domain/requests/RequestCookies.js";
import { HttpResponse } from "../../../domain/responses/HttpResponse.js";
import { RESPONSE_WIRE } from "../../../domain/responses/ResponseWire.js";
import type { IHttpServerOptions } from "../../../domain/server/IHttpServerOptions.js";
import type { IHttpListenOptions } from "../../../domain/server/IHttpListenOptions.js";
import type { IHttpAddress } from "../../../domain/server/IHttpAddress.js";
import type { IHttpErrorContext } from "../../../domain/server/IHttpErrorContext.js";

const CHALLENGE_SCHEME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const CHALLENGE_REALM = /^[\x20-\x21\x23-\x5b\x5d-\x7e]*$/;

/** Explicit one-use Node HTTP/1.1 lifecycle with no import-time resources or controller ownership. */
export class HttpServer {
  readonly #routes: PreparedRoutes;
  readonly #options: IHttpServerOptions;
  readonly #challenge: string | undefined;
  #server: Server | undefined;
  #hasListened = false;
  #isClosed = false;
  #closePromise: Promise<void> | undefined;

  /** Prepares metadata only; construction never opens a listener. */
  private constructor(options: IHttpServerOptions) {
    if (!Array.isArray(options.controllers) || typeof options.onError !== "function")
      throw new TypeError("Invalid server options");
    this.#routes = new PreparedRoutes([...options.controllers]);
    const authentication = options.authentication;
    if (authentication !== undefined) {
      if (
        typeof authentication.authenticate !== "function" ||
        typeof authentication.challenge.scheme !== "string" ||
        !CHALLENGE_SCHEME.test(authentication.challenge.scheme)
      )
        throw new TypeError("Invalid authentication challenge");
      const realm = authentication.challenge.realm;
      if (realm !== undefined && (typeof realm !== "string" || !CHALLENGE_REALM.test(realm)))
        throw new TypeError("Invalid authentication realm");
      this.#challenge =
        authentication.challenge.scheme + (realm === undefined ? "" : ` realm="${realm}"`);
    }
    this.#options = Object.freeze({
      controllers: Object.freeze([...options.controllers]),
      onError: options.onError,
      ...(authentication === undefined
        ? {}
        : {
            authentication: Object.freeze({
              ...authentication,
              challenge: Object.freeze({ ...authentication.challenge }),
            }),
          }),
    });
  }

  /** Synchronous validated composition without consumer construction or resource startup. */
  public static create(options: IHttpServerOptions): HttpServer {
    return new HttpServer(options);
  }

  /** Starts once, observes native startup failure and supports ephemeral ports. */
  public async listen(options: IHttpListenOptions): Promise<void> {
    if (this.#hasListened || this.#isClosed) throw new Error("HTTP server is one-use");
    if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535)
      throw new TypeError("Invalid listen port");
    this.#hasListened = true;
    const server = createServer((request, response) => {
      void this.#handle(request, response);
    });
    this.#server = server;
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(options.port, options.host, () => {
        server.removeListener("error", reject);
        resolve();
      });
    });
  }

  /** Returns a detached actual address only while the native server is listening. */
  public address(): IHttpAddress | undefined {
    const address = this.#server?.address();
    if (typeof address !== "object" || address === null) return undefined;
    return Object.freeze({ host: address.address, port: address.port });
  }

  /** Idempotent stop, including before listen; no controller destruction or process signal handlers. */
  public close(): Promise<void> {
    this.#isClosed = true;
    if (this.#closePromise !== undefined) return this.#closePromise;
    const server = this.#server;
    if (server === undefined || !server.listening) {
      this.#closePromise = Promise.resolve();
    } else {
      this.#closePromise = promisify(server.close.bind(server))();
    }
    return this.#closePromise;
  }

  /** Supervises every request failure and commits only normalized, schema-validated responses. */
  async #handle(incoming: IncomingMessage, outgoing: ServerResponse): Promise<void> {
    const requestId = randomUUID();
    const abort = new AbortController();
    outgoing.once("close", () => {
      if (!outgoing.writableFinished) abort.abort();
    });
    let phase: IHttpErrorContext["phase"] = "input";
    let route: string | undefined;
    try {
      const targetResult = RequestTarget.parse(String(incoming.url));
      if (!targetResult.ok) {
        this.#problem(outgoing, requestId, targetResult.status);
        return;
      }
      const target = targetResult.value;
      const headersResult = RequestHeaders.parse(incoming.rawHeaders);
      if (!headersResult.ok) {
        this.#problem(outgoing, requestId, headersResult.status);
        return;
      }
      const headers = headersResult.value;
      const cookiesResult = RequestCookies.parse(headers.getAll("cookie"));
      if (!cookiesResult.ok) {
        this.#problem(outgoing, requestId, cookiesResult.status);
        return;
      }
      const cookies = cookiesResult.value;
      const match = this.#routes.match(target.pathname);
      if (match === undefined) {
        this.#problem(outgoing, requestId, 404);
        return;
      }
      route = match.route.template;
      if (incoming.method !== "GET") {
        outgoing.setHeader("Allow", "GET");
        this.#problem(outgoing, requestId, 405);
        return;
      }
      const request = HttpRequest[REQUEST_CREATION]({
        requestId,
        method: incoming.method,
        url: String(incoming.url),
        pathname: target.pathname,
        route,
        params: match.params,
        query: target.query,
        remoteAddress: incoming.socket.remoteAddress,
        signal: abort.signal,
        headers,
        cookies,
      });
      phase = "authentication";
      if (this.#options.authentication !== undefined) {
        const userId = await this.#options.authentication.authenticate(request);
        if (userId === undefined) {
          outgoing.setHeader("WWW-Authenticate", String(this.#challenge));
          this.#problem(outgoing, requestId, 401);
          return;
        }
        if (typeof userId !== "string" || userId.length === 0)
          throw new Error("Invalid authentication result");
      }
      phase = "controller";
      const result: unknown = await Reflect.apply(match.route.handler, match.route.controller, []);
      phase = "output";
      if (!(result instanceof HttpResponse)) throw new Error("Invalid HTTP response result");
      const value = result[RESPONSE_WIRE]();
      const declaration = match.route.response;
      if (value.status !== declaration.status) throw new Error("Undeclared response status");
      let body = "";
      if (declaration.status !== 204) {
        const values = declaration.isArray === true ? value.body : [value.body];
        if (!Array.isArray(values)) throw new Error("Expected DTO array");
        const projected = [];
        for (const item of values) {
          const serialized = Schema.safeSerialize(declaration.type, item);
          if (!serialized.ok) throw new Error("Invalid response DTO");
          projected.push(serialized.value);
        }
        body = JSON.stringify(declaration.isArray === true ? projected : projected[0]);
      }
      for (const [name, fields] of Object.entries(value.headers))
        outgoing.setHeader(name, typeof fields === "string" ? fields : [...fields]);
      outgoing.setHeader("X-Request-Id", requestId);
      if (declaration.status !== 204) {
        outgoing.setHeader("Content-Type", "application/json");
        outgoing.setHeader("Content-Length", Buffer.byteLength(body));
      }
      outgoing.statusCode = value.status;
      outgoing.end(body);
    } catch (error: unknown) {
      this.#diagnose(error, {
        requestId,
        method: String(incoming.method),
        route: String(route),
        phase,
      });
      this.#problem(outgoing, requestId, 500);
    }
  }

  /** Emits secret-safe RFC 9457 failures without exposing exception messages or raw values. */
  #problem(outgoing: ServerResponse, requestId: string, status: number): void {
    const title = STATUS_CODES[status];
    const body = JSON.stringify({ type: "about:blank", title, status, detail: title, requestId });
    outgoing.statusCode = status;
    outgoing.setHeader("X-Request-Id", requestId);
    outgoing.setHeader("Content-Type", "application/problem+json");
    outgoing.setHeader("Content-Length", Buffer.byteLength(body));
    outgoing.end(body);
  }

  /** Observes invalid diagnostic callbacks without recursion or credential-bearing fallback output. */
  #diagnose(error: unknown, context: IHttpErrorContext): void {
    try {
      const result: unknown = this.#options.onError(
        error instanceof Error ? error : new Error("Non-Error HTTP failure", { cause: error }),
        Object.freeze(context),
      );
      if (result !== undefined)
        void Promise.resolve(result).catch(() => process.emitWarning("HTTP diagnostics rejected"));
    } catch {
      process.emitWarning("HTTP diagnostics failed");
    }
  }
}
