import { createServer, STATUS_CODES } from "node:http";
import type { IncomingMessage, ServerResponse, Server } from "node:http";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import type { Socket } from "node:net";
import type { Duplex } from "node:stream";
import { Schema, SchemaError, SchemaDefinitionError } from "@glacier/schema";
import { PreparedRoutes } from "../../../../application/requestHandling/PreparedRoutes.js";
import { RequestBinding } from "../../../../application/requestHandling/RequestBinding.js";
import { RequestBody } from "./RequestBody.adapter.js";
import { HttpRequest } from "../../../../domain/requestHandling/requests/HttpRequest.js";
import { REQUEST_CREATION } from "../../../../domain/requestHandling/requests/RequestCreation.js";
import { RequestTarget } from "../../../../domain/requestHandling/requests/RequestTarget.js";
import { RequestHeaders } from "../../../../domain/requestHandling/requests/RequestHeaders.js";
import { RequestCookies } from "../../../../domain/requestHandling/requests/RequestCookies.js";
import { HttpResponse } from "../../../../domain/requestHandling/responses/HttpResponse.js";
import { RESPONSE_WIRE } from "../../../../domain/requestHandling/responses/ResponseWire.js";
import type { IHttpServerOptions } from "../../../../domain/requestHandling/server/IHttpServerOptions.js";
import type { IHttpListenOptions } from "../../../../domain/requestHandling/server/IHttpListenOptions.js";
import type { IHttpAddress } from "../../../../domain/requestHandling/server/IHttpAddress.js";
import type { IHttpErrorContext } from "../../../../domain/requestHandling/server/IHttpErrorContext.js";
import type { IHttpInputIssue } from "../../../../domain/requestHandling/requests/types/IHttpInputIssue.js";
import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpServerRegistration } from "../../../../domain/requestHandling/server/IHttpServerRegistration.js";
import type { IHttpEndpointMetadata } from "../../../../domain/requestHandling/routing/types/IHttpEndpointMetadata.js";
import type { IHttpErrorMapping } from "../../../../domain/requestHandling/responses/types/IHttpErrorMapping.js";
import { ErrorMappings } from "../../../../domain/requestHandling/responses/ErrorMappings.js";
import { ResponseLogs } from "../../../../application/requestHandling/ResponseLogs.js";
import { ResponseCompletion } from "./ResponseCompletion.js";
import { HttpContractError } from "../../../../domain/requestHandling/responses/HttpContract.error.js";

const CHALLENGE_SCHEME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const CHALLENGE_REALM = /^[\x20-\x21\x23-\x5b\x5d-\x7e]*$/;
const DEFAULT_BODY_BYTES = 1_048_576;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const MAX_NODE_RECEIVE_LIMIT = 2_147_483_647;
const DEFAULT_PENDING_RESPONSE_LOGS = 1_000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;
const DEFAULT_HEADER_BYTES = 16_384;
const DEFAULT_TARGET_BYTES = 8_192;
const DEFAULT_QUERY_PAIRS = 100;
const DEFAULT_QUERY_DEPTH = 5;
const DEFAULT_HEADERS_TIMEOUT_MS = 10_000;
const MAX_RECEIVE_CHECK_INTERVAL_MS = 1_000;

/** Server-owned controllers, callbacks, transport handles, and requests are not diagnostic fields. */
interface IHttpServerState {
  readonly registrationValue: IHttpServerRegistration;
  readonly logs: ResponseLogs;
  readonly completions: WeakMap<ServerResponse, ResponseCompletion>;
  readonly routes: PreparedRoutes;
  readonly options: IHttpServerOptions;
  readonly challenge: string | undefined;
  readonly bodyBytes: number;
  readonly requestTimeoutMs: number;
  readonly headerBytes: number;
  readonly targetBytes: number;
  readonly queryPairs: number;
  readonly queryDepth: number;
  readonly headersTimeoutMs: number;
  readonly shutdownTimeoutMs: number;
  readonly sockets: Set<Socket>;
  readonly active: Map<AbortController, Promise<void>>;
  readonly chains: WeakMap<Duplex, Promise<void>>;
  readonly rejectedSockets: WeakSet<Duplex>;
  readonly listenAbort: AbortController;
  server: Server | undefined;
  hasListened: boolean;
  isClosed: boolean;
  closePromise: Promise<void> | undefined;
}
const HTTP_SERVER_STATES = new WeakMap<HttpServer, IHttpServerState>();

/** Explicit one-use Node HTTP/1.1 lifecycle with no import-time resources or controller ownership. */
export class HttpServer {
  /** Preserves opaque public output and validates that methods operate on a constructed server. */
  private get state(): IHttpServerState {
    const state = HTTP_SERVER_STATES.get(this);
    if (state === undefined) throw new TypeError("Invalid HTTP server receiver");
    return state;
  }

  /** Prepares metadata only; construction never opens a listener. */
  private constructor(options: IHttpServerOptions) {
    const completions = new WeakMap<ServerResponse, ResponseCompletion>();
    const sockets = new Set<Socket>();
    const active = new Map<AbortController, Promise<void>>();
    const chains = new WeakMap<Duplex, Promise<void>>();
    const rejectedSockets = new WeakSet<Duplex>();
    const listenAbort = new AbortController();
    HttpServer.validateOptions(options);
    const routes = new PreparedRoutes(
      [...options.controllers],
      options.authentication !== undefined,
    );
    const bodyBytes = options.limits?.bodyBytes ?? DEFAULT_BODY_BYTES;
    const requestTimeoutMs = options.limits?.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    const headerBytes = options.limits?.headerBytes ?? DEFAULT_HEADER_BYTES;
    const targetBytes = options.limits?.requestTargetBytes ?? DEFAULT_TARGET_BYTES;
    const queryPairs = options.limits?.queryPairs ?? DEFAULT_QUERY_PAIRS;
    const queryDepth = options.limits?.queryDepth ?? DEFAULT_QUERY_DEPTH;
    const headersTimeoutMs = HttpServer.headersTimeout(
      options.limits?.headersTimeoutMs,
      requestTimeoutMs,
    );
    const pendingResponseLogs =
      options.limits?.pendingResponseLogs ?? DEFAULT_PENDING_RESPONSE_LOGS;
    const shutdownTimeoutMs = options.limits?.shutdownTimeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS;
    const registrationValue = Object.freeze({
      // PreparedRoutes already validates these constructor identities through public reflection.
      controllers: Object.freeze(
        options.controllers.map(
          (controller) => controller.constructor as IConstructableClass<object>,
        ),
      ),
      errorMappings: ErrorMappings.prepare(options.errorMappings ?? []),
      hasAuthentication: options.authentication !== undefined,
    });
    const logs = new ResponseLogs(options.onResponseLog, pendingResponseLogs, (error, context) => {
      this.diagnose(error, context);
    });
    const challenge = HttpServer.createChallenge(options.authentication);
    const snapshot = HttpServer.snapshotOptions(options);
    HTTP_SERVER_STATES.set(this, {
      registrationValue,
      logs,
      completions,
      routes,
      options: snapshot,
      challenge,
      bodyBytes,
      requestTimeoutMs,
      headerBytes,
      targetBytes,
      queryPairs,
      queryDepth,
      headersTimeoutMs,
      shutdownTimeoutMs,
      sockets,
      active,
      chains,
      rejectedSockets,
      listenAbort,
      server: undefined,
      hasListened: false,
      isClosed: false,
      closePromise: undefined,
    });
  }

  private static validateOptions(options: IHttpServerOptions): void {
    if (!Array.isArray(options.controllers) || typeof options.onError !== "function")
      throw new TypeError("Invalid server options");
    HttpServer.validateLimits(options.limits);
    if (options.onResponseLog !== undefined && typeof options.onResponseLog !== "function")
      throw new TypeError("Invalid response logging hook");
  }

  private static validateLimits(limits: IHttpServerOptions["limits"]): void {
    if (
      limits !== undefined &&
      (typeof limits !== "object" || limits === null || Array.isArray(limits))
    )
      throw new TypeError("Invalid server limits");
    for (const limit of Object.values(limits ?? {})) {
      if (!Number.isSafeInteger(limit) || limit <= 0 || limit > MAX_NODE_RECEIVE_LIMIT)
        throw new TypeError("Invalid server limit");
    }
  }

  private static headersTimeout(supplied: number | undefined, requestTimeoutMs: number): number {
    const timeout = supplied ?? Math.min(DEFAULT_HEADERS_TIMEOUT_MS, requestTimeoutMs);
    if (timeout > requestTimeoutMs)
      throw new TypeError("Header receive limit exceeds request receive limit");
    return timeout;
  }

  private static createChallenge(
    authentication: IHttpServerOptions["authentication"],
  ): string | undefined {
    if (authentication === undefined) return undefined;
    const challenge = authentication.challenge;
    if (
      typeof authentication.authenticate !== "function" ||
      challenge === undefined ||
      typeof challenge.scheme !== "string" ||
      !CHALLENGE_SCHEME.test(challenge.scheme)
    )
      throw new TypeError("Invalid authentication challenge");
    const realm = challenge.realm;
    if (realm !== undefined && (typeof realm !== "string" || !CHALLENGE_REALM.test(realm)))
      throw new TypeError("Invalid authentication realm");
    return challenge.scheme + (realm === undefined ? "" : ` realm="${realm}"`);
  }

  private static snapshotOptions(options: IHttpServerOptions): IHttpServerOptions {
    const authentication = options.authentication;
    return Object.freeze({
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

  /** Detached immutable composition for documentation consumers; contains no resources or callbacks. */
  public get registration(): IHttpServerRegistration {
    return this.state.registrationValue;
  }

  /** Starts once, observes native startup failure and supports ephemeral ports. */
  public async listen(options: IHttpListenOptions): Promise<void> {
    if (this.state.hasListened || this.state.isClosed) throw new Error("HTTP server is one-use");
    if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535)
      throw new TypeError("Invalid listen port");
    if (
      options.host !== undefined &&
      (typeof options.host !== "string" || options.host.length === 0)
    )
      throw new TypeError("Invalid listen host");
    this.state.hasListened = true;
    const server = createServer(
      {
        maxHeaderSize: this.state.headerBytes,
        headersTimeout: this.state.headersTimeoutMs,
        requestTimeout: this.state.requestTimeoutMs,
        connectionsCheckingInterval: Math.min(
          MAX_RECEIVE_CHECK_INTERVAL_MS,
          this.state.headersTimeoutMs,
          this.state.requestTimeoutMs,
        ),
      },
      (request, response) => {
        this.dispatch(request, response);
      },
    );
    // Native's default count cap silently drops headers; byte bounds must reject, never truncate.
    server.maxHeadersCount = 0;
    server.on("connection", (socket) => {
      this.state.sockets.add(socket);
      socket.once("close", () => {
        this.state.sockets.delete(socket);
      });
    });
    server.on("clientError", (error, socket) => {
      this.clientError(error, socket);
    });
    server.on("checkContinue", (request, response) => {
      this.dispatch(request, response, true);
    });
    server.on("checkExpectation", (request, response) => {
      this.dispatch(request, response, false, true);
    });
    this.state.server = server;
    let rejectStartup: (error: Error) => void;
    const cancelled = () => {
      rejectStartup(new Error("HTTP startup cancelled"));
    };
    const failed = (error: Error) => {
      rejectStartup(error);
    };
    try {
      await new Promise<void>((resolve, reject) => {
        rejectStartup = reject;
        server.once("error", failed);
        this.state.listenAbort.signal.addEventListener("abort", cancelled, { once: true });
        server.listen(
          {
            port: options.port,
            ...(options.host === undefined ? {} : { host: options.host }),
            signal: this.state.listenAbort.signal,
          },
          resolve,
        );
      });
    } catch (error: unknown) {
      this.state.listenAbort.abort();
      this.diagnose(error, { phase: "startup" });
      throw error;
    } finally {
      server.removeListener("error", failed);
      this.state.listenAbort.signal.removeEventListener("abort", cancelled);
    }
  }

  /** Returns a detached actual address only while the native server is listening. */
  public address(): IHttpAddress | undefined {
    const address = this.state.server?.address();
    if (typeof address !== "object" || address === null) return undefined;
    return Object.freeze({ host: address.address, port: address.port });
  }

  /** Idempotent stop, including before listen; no controller destruction or process signal handlers. */
  public close(): Promise<void> {
    this.state.isClosed = true;
    if (this.state.closePromise !== undefined) return this.state.closePromise;
    this.state.closePromise = this.shutdown();
    return this.state.closePromise;
  }

  /** Stops acceptance immediately and bounds all owned draining; arbitrary hook promises remain cooperative. */
  private async shutdown(): Promise<void> {
    const server = this.state.server;
    if (server === undefined) return;
    if (!server.listening) this.state.listenAbort.abort();
    const transport = server.listening ? promisify(server.close.bind(server))() : Promise.resolve();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.drain(transport),
        new Promise<never>((resolve, reject) => {
          void resolve;
          timer = setTimeout(() => {
            for (const abort of this.state.active.keys()) abort.abort();
            for (const socket of this.state.sockets) socket.destroy();
            reject(new Error("HTTP shutdown request/transport/logging drain timed out"));
          }, this.state.shutdownTimeoutMs);
        }),
      ]);
    } catch (error: unknown) {
      this.diagnose(error, { phase: "shutdown" });
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Drains dependents before logging; response completion callbacks run before native transport closes. */
  private async drain(transport: Promise<void>): Promise<void> {
    await transport;
    await Promise.all(this.state.active.values());
    await this.state.logs.drain();
  }

  /** Tracks handlers even after disconnect so close cannot silently abandon application work. */
  private dispatch(
    incoming: IncomingMessage,
    outgoing: ServerResponse,
    isContinue = false,
    isExpectationRejected = false,
  ): void {
    if (this.state.isClosed) {
      incoming.socket.destroy();
      return;
    }
    const abort = new AbortController();
    // Schedule after registration so even synchronous routing rejections release their tracked entry.
    const previous = this.state.chains.get(incoming.socket) ?? Promise.resolve();
    const pending = previous
      .then(() => this.handle(incoming, outgoing, abort, isContinue, isExpectationRejected))
      .finally(() => {
        this.state.active.delete(abort);
      });
    this.state.chains.set(incoming.socket, pending);
    this.state.active.set(abort, pending);
  }

  /** Parser failures have no normalized identity or request hook promise; close without draining hostile input. */
  private clientError(error: Error & { code?: string }, socket: Duplex): void {
    // An earlier response may still be in flight. Never append a parser status into its body.
    this.state.rejectedSockets.add(socket);
    if (
      this.state.chains.has(socket) ||
      socket.destroyed ||
      !socket.writable ||
      socket.writableEnded
    ) {
      socket.destroy();
      return;
    }
    let status = 400;
    if (error.code === "HPE_HEADER_OVERFLOW") status = 431;
    else if (error.code === "ERR_HTTP_REQUEST_TIMEOUT") status = 408;
    // Half-close immediately and bound a peer that refuses to finish its side of the connection.
    socket.end(
      `HTTP/1.1 ${status} ${STATUS_CODES[status]}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`,
      () => socket.destroy(),
    );
  }

  /** Supervises every request failure and commits only normalized, schema-validated responses. */
  private async handle(
    incoming: IncomingMessage,
    outgoing: ServerResponse,
    abort: AbortController,
    isContinue: boolean,
    isExpectationRejected: boolean,
  ): Promise<void> {
    if (this.state.rejectedSockets.has(incoming.socket)) {
      outgoing.destroy();
      return;
    }
    const requestId = randomUUID();
    const completion = new ResponseCompletion(
      outgoing,
      requestId,
      String(incoming.method),
      (record) => {
        this.state.logs.write(record);
      },
    );
    this.state.completions.set(outgoing, completion);
    outgoing.once("close", () => {
      if (!outgoing.writableFinished) abort.abort();
    });
    const context: IRequestContextState = {
      current: { requestId, method: String(incoming.method), phase: "input" },
    };
    try {
      await this.processRequest(
        incoming,
        outgoing,
        abort,
        requestId,
        completion,
        context,
        isContinue,
        isExpectationRejected,
      );
    } catch (error: unknown) {
      completion.fail();
      this.diagnose(error, context.current);
      this.problem(outgoing, requestId, 500, [], true);
    }
  }

  private async processRequest(
    incoming: IncomingMessage,
    outgoing: ServerResponse,
    abort: AbortController,
    requestId: string,
    completion: ResponseCompletion,
    context: IRequestContextState,
    isContinue: boolean,
    isExpectationRejected: boolean,
  ): Promise<void> {
    const prepared = this.prepareRequest(
      incoming,
      outgoing,
      requestId,
      completion,
      context,
      isContinue,
      isExpectationRejected,
    );
    if (prepared === undefined) return;
    const request = HttpServer.request(incoming, abort, requestId, prepared);
    const endpoint = prepared.selected.route.metadata;
    context.current = { ...context.current, phase: "authentication" };
    const userId = await this.authenticate(request, endpoint, outgoing, requestId, completion);
    if (!userId.ok) return;
    context.current = { ...context.current, phase: "input" };
    const binding = await this.bindRequest(
      incoming,
      outgoing,
      prepared,
      request,
      userId.value,
      requestId,
      isContinue,
    );
    if (binding === undefined) return;
    context.current = { ...context.current, phase: "controller" };
    const invocation = await this.invokeController(
      prepared.selected,
      endpoint,
      binding.arguments,
      outgoing,
      requestId,
      completion,
      context,
    );
    if (invocation.handled) return;
    context.current = { ...context.current, phase: "output" };
    this.writeResponse(
      invocation.value,
      prepared,
      request,
      outgoing,
      requestId,
      completion,
      context,
      isContinue,
      binding.shouldReadBody,
    );
  }

  private prepareRequest(
    incoming: IncomingMessage,
    outgoing: ServerResponse,
    requestId: string,
    completion: ResponseCompletion,
    context: IRequestContextState,
    isContinue: boolean,
    isExpectationRejected: boolean,
  ): IPreparedRequest | undefined {
    const target = this.parseTarget(incoming, outgoing, requestId);
    if (target === undefined) return undefined;
    const match = this.state.routes.match(target.pathname, String(incoming.method));
    const selected = match?.selected;
    if (selected !== undefined) {
      const metadata = selected.route.metadata;
      completion.match(metadata.template, metadata.isResponseLoggingSkipped);
      context.current = { ...context.current, route: metadata.template };
    }
    if (isExpectationRejected) {
      this.problem(outgoing, requestId, 417, [], true);
      return undefined;
    }
    const headers = this.parseHeaders(incoming, outgoing, requestId);
    if (headers === undefined) return undefined;
    const cookies = this.parseCookies(headers, outgoing, requestId);
    if (cookies === undefined) return undefined;
    if (match === undefined) {
      this.problem(outgoing, requestId, 404, [], true);
      return undefined;
    }
    if (this.handleOptions(incoming, outgoing, requestId, match, headers, isContinue))
      return undefined;
    if (selected === undefined) {
      outgoing.setHeader("Allow", match.allow);
      this.problem(outgoing, requestId, 405, [], true);
      return undefined;
    }
    return { target, selected, headers, cookies };
  }

  private parseTarget(
    incoming: IncomingMessage,
    outgoing: ServerResponse,
    requestId: string,
  ): Extract<ReturnType<typeof RequestTarget.parse>, { readonly ok: true }>["value"] | undefined {
    const result = RequestTarget.parse(
      String(incoming.url),
      this.state.targetBytes,
      this.state.queryPairs,
      this.state.queryDepth,
    );
    if (result.ok) return result.value;
    this.problem(outgoing, requestId, result.status, [], true);
    return undefined;
  }

  private parseHeaders(
    incoming: IncomingMessage,
    outgoing: ServerResponse,
    requestId: string,
  ): RequestHeaders | undefined {
    const result = RequestHeaders.parse(incoming.rawHeaders);
    if (result.ok) return result.value;
    this.problem(outgoing, requestId, result.status, [], true);
    return undefined;
  }

  private parseCookies(
    headers: RequestHeaders,
    outgoing: ServerResponse,
    requestId: string,
  ): RequestCookies | undefined {
    const result = RequestCookies.parse(headers.getAll("cookie"));
    if (result.ok) return result.value;
    this.problem(outgoing, requestId, result.status, [], true);
    return undefined;
  }

  private handleOptions(
    incoming: IncomingMessage,
    outgoing: ServerResponse,
    requestId: string,
    match: NonNullable<ReturnType<PreparedRoutes["match"]>>,
    headers: RequestHeaders,
    isContinue: boolean,
  ): boolean {
    if (incoming.method !== "OPTIONS") return false;
    outgoing.setHeader("Allow", match.allow);
    outgoing.setHeader("X-Request-Id", requestId);
    const hasBody =
      isContinue ||
      Number(headers.get("content-length")) > 0 ||
      headers.get("transfer-encoding") !== undefined;
    if (hasBody) outgoing.setHeader("Connection", "close");
    outgoing.statusCode = 204;
    outgoing.end();
    return true;
  }

  private static request(
    incoming: IncomingMessage,
    abort: AbortController,
    requestId: string,
    prepared: IPreparedRequest,
  ): HttpRequest {
    const endpoint = prepared.selected.route.metadata;
    return HttpRequest[REQUEST_CREATION]({
      requestId,
      method: String(incoming.method),
      url: String(incoming.url),
      pathname: prepared.target.pathname,
      route: endpoint.template,
      params: prepared.selected.params,
      query: prepared.target.query,
      remoteAddress: incoming.socket.remoteAddress,
      signal: abort.signal,
      headers: prepared.headers,
      cookies: prepared.cookies,
    });
  }

  private async authenticate(
    request: HttpRequest,
    endpoint: IHttpEndpointMetadata,
    outgoing: ServerResponse,
    requestId: string,
    completion: ResponseCompletion,
  ): Promise<{ readonly ok: true; readonly value: string | undefined } | { readonly ok: false }> {
    let userId: string | undefined;
    if (this.state.options.authentication !== undefined && !endpoint.isPublic) {
      userId = await this.state.options.authentication.authenticate(request);
      if (userId === undefined) {
        outgoing.setHeader("WWW-Authenticate", String(this.state.challenge));
        this.problem(outgoing, requestId, 401, [], true);
        return { ok: false };
      }
      if (typeof userId !== "string" || userId.length === 0)
        throw new Error("Invalid authentication result");
    }
    completion.authenticate(userId);
    return { ok: true, value: userId };
  }

  private async bindRequest(
    incoming: IncomingMessage,
    outgoing: ServerResponse,
    prepared: IPreparedRequest,
    request: HttpRequest,
    userId: string | undefined,
    requestId: string,
    isContinue: boolean,
  ): Promise<
    { readonly arguments: readonly unknown[]; readonly shouldReadBody: boolean } | undefined
  > {
    const endpoint = prepared.selected.route.metadata;
    const hasBodyBinder = endpoint.bindings.some((binding) => binding.location === "body");
    const preflight = RequestBody.preflight(prepared.headers, hasBodyBinder, this.state.bodyBytes);
    if (preflight !== undefined) {
      this.problem(outgoing, requestId, preflight, [], true);
      return undefined;
    }
    const shouldReadBody = hasBodyBinder || prepared.headers.get("transfer-encoding") !== undefined;
    const body = await this.readBody(
      incoming,
      outgoing,
      requestId,
      hasBodyBinder,
      shouldReadBody,
      isContinue,
    );
    if (!body.ok) return undefined;
    const binding = RequestBinding.bind(
      endpoint.bindings,
      request,
      body.value,
      prepared.headers.toRecord(),
      prepared.cookies.toRecord(),
      userId,
    );
    if (!binding.ok) {
      this.problem(outgoing, requestId, 400, binding.issues);
      return undefined;
    }
    return { arguments: binding.arguments, shouldReadBody };
  }

  private async readBody(
    incoming: IncomingMessage,
    outgoing: ServerResponse,
    requestId: string,
    hasBodyBinder: boolean,
    shouldReadBody: boolean,
    isContinue: boolean,
  ): Promise<{ readonly ok: true; readonly value: unknown } | { readonly ok: false }> {
    if (!shouldReadBody) return { ok: true, value: undefined };
    if (isContinue) outgoing.writeContinue();
    const result = await RequestBody.read(
      incoming,
      this.state.bodyBytes,
      this.state.requestTimeoutMs,
      hasBodyBinder,
    );
    if (result.ok) return { ok: true, value: result.value };
    this.problem(outgoing, requestId, result.status, [], true);
    return { ok: false };
  }

  private async invokeController(
    selected: IPreparedRequest["selected"],
    endpoint: IHttpEndpointMetadata,
    arguments_: readonly unknown[],
    outgoing: ServerResponse,
    requestId: string,
    completion: ResponseCompletion,
    context: IRequestContextState,
  ): Promise<{ readonly handled: true } | { readonly handled: false; readonly value: unknown }> {
    try {
      const value = await Reflect.apply(
        selected.route.handler,
        selected.route.controller,
        arguments_,
      );
      return { handled: false, value };
    } catch (error: unknown) {
      const mapping = ErrorMappings.resolve(error, [
        endpoint.endpointErrorMappings,
        endpoint.controllerErrorMappings,
        this.state.registrationValue.errorMappings,
      ]);
      if (mapping === undefined) throw error;
      if (mapping.status >= 500) {
        completion.fail();
        this.diagnose(error, context.current);
      }
      this.problem(outgoing, requestId, mapping.status, [], false, mapping);
      return { handled: true };
    }
  }

  private writeResponse(
    result: unknown,
    prepared: IPreparedRequest,
    request: HttpRequest,
    outgoing: ServerResponse,
    requestId: string,
    completion: ResponseCompletion,
    context: IRequestContextState,
    isContinue: boolean,
    shouldReadBody: boolean,
  ): void {
    if (result !== undefined && !(result instanceof HttpResponse))
      throw new Error("Invalid HTTP response result");
    const value =
      result === undefined ? HttpResponse.noContent()[RESPONSE_WIRE]() : result[RESPONSE_WIRE]();
    const endpoint = prepared.selected.route.metadata;
    const declaration = endpoint.responses.find((response) => response.status === value.status);
    if (declaration === undefined) throw new Error("Undeclared response status");
    const body = this.serializeResponseBody(
      declaration,
      value.body,
      request,
      requestId,
      outgoing,
      completion,
      context,
    );
    if (body === undefined) return;
    for (const [name, fields] of Object.entries(value.headers))
      outgoing.setHeader(name, typeof fields === "string" ? fields : [...fields]);
    outgoing.setHeader("X-Request-Id", requestId);
    if (declaration.status !== 204) {
      outgoing.setHeader("Content-Type", "application/json");
      outgoing.setHeader("Content-Length", Buffer.byteLength(body));
    }
    outgoing.statusCode = value.status;
    if (isContinue && !shouldReadBody) outgoing.setHeader("Connection", "close");
    this.send(outgoing, body);
  }

  private serializeResponseBody(
    declaration: IHttpEndpointMetadata["responses"][number],
    value: unknown,
    request: HttpRequest,
    requestId: string,
    outgoing: ServerResponse,
    completion: ResponseCompletion,
    context: IRequestContextState,
  ): string | undefined {
    if (declaration.status === 204) return "";
    const values = declaration.isArray === true ? value : [value];
    if (!Array.isArray(values)) throw new Error("Expected DTO array");
    const projected: unknown[] = [];
    for (const item of values) {
      const serialized = Schema.safeSerialize(declaration.type, item);
      if (!serialized.ok) {
        this.responseSerializationFailure(
          serialized.issues,
          request,
          requestId,
          outgoing,
          completion,
          context,
        );
        return undefined;
      }
      projected.push(serialized.value);
    }
    return JSON.stringify(declaration.isArray === true ? projected : projected[0]);
  }

  private responseSerializationFailure(
    issues: readonly { readonly path: readonly (string | number)[]; readonly code: string }[],
    request: HttpRequest,
    requestId: string,
    outgoing: ServerResponse,
    completion: ResponseCompletion,
    context: IRequestContextState,
  ): void {
    completion.fail();
    this.diagnose(new Error("Invalid response DTO"), {
      ...context.current,
      method: request.method,
      phase: "output",
      issues: Object.freeze(
        issues.map((issue) =>
          Object.freeze({ path: Object.freeze([...issue.path]), code: issue.code }),
        ),
      ),
    });
    this.problem(outgoing, requestId, 500);
  }

  /** Emits secret-safe RFC 9457 failures without exposing exception messages or raw values. */
  private problem(
    outgoing: ServerResponse,
    requestId: string,
    status: number,
    issues: readonly IHttpInputIssue[] = [],
    shouldClose = false,
    mapping?: IHttpErrorMapping,
  ): void {
    if (outgoing.destroyed || outgoing.req.socket.destroyed || outgoing.req.socket.writableEnded)
      return;
    const title = mapping?.title ?? STATUS_CODES[status];
    const body = JSON.stringify({
      type: mapping?.type ?? "about:blank",
      title,
      status,
      detail: mapping?.detail ?? title,
      requestId,
      ...(issues.length === 0 ? {} : { issues }),
    });
    outgoing.statusCode = status;
    if (status === 401 && this.state.challenge !== undefined)
      outgoing.setHeader("WWW-Authenticate", this.state.challenge);
    outgoing.setHeader("X-Request-Id", requestId);
    outgoing.setHeader("Content-Type", "application/problem+json");
    outgoing.setHeader("Content-Length", Buffer.byteLength(body));
    if (shouldClose) {
      this.state.rejectedSockets.add(outgoing.req.socket);
      outgoing.setHeader("Connection", "close");
    }
    this.send(outgoing, body);
  }

  /** Accounts only final body bytes actually handed to the native transport, never delivery. */
  private send(outgoing: ServerResponse, body: string): void {
    if (outgoing.destroyed || outgoing.req.socket.destroyed) return;
    const payload = outgoing.req.method === "HEAD" ? "" : body;
    outgoing.end(payload);
    this.state.completions.get(outgoing)?.handOff(Buffer.byteLength(payload));
  }

  /** Observes invalid diagnostic callbacks without recursion or credential-bearing fallback output. */
  private diagnose(error: unknown, context: IHttpErrorContext): void {
    // Schema params and native factory causes can carry boundary values; never forward them.
    let diagnostic = error;
    if (error instanceof SchemaError) {
      diagnostic = new Error("HTTP schema validation failure");
      context = {
        ...context,
        issues: Object.freeze(
          error.issues.map((issue) =>
            Object.freeze({ path: Object.freeze([...issue.path]), code: issue.code }),
          ),
        ),
      };
    } else if (error instanceof SchemaDefinitionError) {
      diagnostic = new Error("HTTP schema definition failure");
    } else if (error instanceof HttpContractError) {
      diagnostic = new Error("HTTP transport value failure");
    }
    try {
      const result: unknown = this.state.options.onError(
        diagnostic instanceof Error
          ? diagnostic
          : new Error("Non-Error HTTP failure", { cause: diagnostic }),
        Object.freeze(context),
      );
      if (result !== undefined)
        void Promise.resolve(result).then(
          () => process.emitWarning("HTTP diagnostics must be synchronous"),
          () => process.emitWarning("HTTP diagnostics rejected"),
        );
    } catch {
      process.emitWarning("HTTP diagnostics failed");
    }
  }
}

interface IRequestContextState {
  current: IHttpErrorContext;
}

interface IPreparedRequest {
  readonly target: Extract<ReturnType<typeof RequestTarget.parse>, { readonly ok: true }>["value"];
  readonly selected: NonNullable<NonNullable<ReturnType<PreparedRoutes["match"]>>["selected"]>;
  readonly headers: RequestHeaders;
  readonly cookies: RequestCookies;
}
