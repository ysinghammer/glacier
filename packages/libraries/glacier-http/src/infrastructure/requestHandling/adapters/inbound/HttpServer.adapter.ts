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

/** Holds the server's immutable configuration and private transport lifecycle state. */
interface IHttpServerState {
  /** Detached controller and error-mapping metadata exposed by registration. */
  readonly registrationValue: IHttpServerRegistration;
  /** Bounded response-log queue (default capacity 1,000) and its synchronous diagnostic callback. */
  readonly logs: ResponseLogs;
  /** Associates each native response with its one-shot completion accounting. */
  readonly completions: WeakMap<ServerResponse, ResponseCompletion>;
  /** Compiled routes used to match incoming request targets. */
  readonly routes: PreparedRoutes;
  /** Frozen copy of callbacks and controller references supplied at creation. */
  readonly options: IHttpServerOptions;
  /**
   * Precomputed authentication challenge, absent when authentication is disabled.
   * @default undefined when authentication is disabled.
   */
  readonly challenge: string | undefined;
  /**
   * Maximum accepted request-body size in bytes.
   * @default 1_048_576 bytes when no body limit is configured.
   */
  readonly bodyBytes: number;
  /**
   * Maximum time allowed for receiving a complete request in milliseconds.
   * @default 30_000 ms when no request timeout is configured.
   */
  readonly requestTimeoutMs: number;
  /**
   * Maximum header section size in bytes.
   * @default 16_384 bytes when no header limit is configured.
   */
  readonly headerBytes: number;
  /**
   * Maximum request-target size in bytes.
   * @default 8_192 bytes when no target limit is configured.
   */
  readonly targetBytes: number;
  /**
   * Maximum number of parsed query pairs.
   * @default 100 pairs when no query-pair limit is configured.
   */
  readonly queryPairs: number;
  /**
   * Maximum nested query-value depth.
   * @default Depth 5 when no query-depth limit is configured.
   */
  readonly queryDepth: number;
  /**
   * Maximum time allowed to receive request headers in milliseconds.
   * @default Lesser of 10_000 ms and the request timeout when unset.
   */
  readonly headersTimeoutMs: number;
  /**
   * Maximum graceful shutdown drain duration in milliseconds.
   * @default 10_000 ms when no shutdown timeout is configured.
   */
  readonly shutdownTimeoutMs: number;
  /**
   * Native sockets owned by this server until their close events.
   * @default Empty set at construction.
   */
  readonly sockets: Set<Socket>;
  /**
   * Request handlers currently being supervised during shutdown.
   * @default Empty map at construction.
   */
  readonly active: Map<AbortController, Promise<void>>;
  /**
   * Per-socket request chains preserving request processing order.
   * @default Empty weak map at construction.
   */
  readonly chains: WeakMap<Duplex, Promise<void>>;
  /**
   * Sockets rejected by parser or response handling and not reused.
   * @default Empty weak set at construction.
   */
  readonly rejectedSockets: WeakSet<Duplex>;
  /**
   * Cancels an in-progress native listen operation when shutdown begins.
   * @default New, non-aborted controller.
   */
  readonly listenAbort: AbortController;
  /**
   * Native listener after listen begins; absent before startup.
   * @default undefined
   */
  server: Server | undefined;
  /**
   * Whether the one allowed listen attempt has started.
   * @default false
   */
  hasListened: boolean;
  /**
   * Whether close has been requested.
   * @default false
   */
  isClosed: boolean;
  /**
   * Shared shutdown result returned to every close caller.
   * @default undefined
   */
  closePromise: Promise<void> | undefined;
}
const HTTP_SERVER_STATES = new WeakMap<HttpServer, IHttpServerState>();

/** Configures one-use Node HTTP/1.1 serving; construction opens no listener, and explicit methods own lifecycle. */
export class HttpServer {
  /**
   * Retrieves private state and rejects receivers that were not constructed by this class.
   * @returns Private lifecycle and configuration state for this server.
   * @throws {TypeError} If the receiver was not created by HttpServer.
   */
  private get state(): IHttpServerState {
    const state = HTTP_SERVER_STATES.get(this);
    if (state === undefined) throw new TypeError("Invalid HTTP server receiver");
    return state;
  }

  /**
   * Validates and snapshots configuration without opening a listener or constructing controllers.
   * @param options IHttpServerOptions with instances, callbacks, and optional configuration to own.
   */
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

  /**
   * Validates required callbacks and optional limits before state is assembled.
   * @param options Server settings to validate.
   * @returns No value; throws when required callbacks or limits are invalid.
   * @throws {TypeError} If the controller list or a required or supplied callback is invalid.
   */
  private static validateOptions(options: IHttpServerOptions): void {
    if (!Array.isArray(options.controllers) || typeof options.onError !== "function")
      throw new TypeError("Invalid server options");
    HttpServer.validateLimits(options.limits);
    if (options.onResponseLog !== undefined && typeof options.onResponseLog !== "function")
      throw new TypeError("Invalid response logging hook");
  }

  /**
   * Requires every supplied receive limit to be a positive safe Node-compatible integer.
   * @param limits Optional configured positive receive and lifecycle limits.
   * @returns No value; throws if limits is not a record of supported positive integers.
   * @throws {TypeError} If limits is not a record or any value is out of range.
   */
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

  /**
   * Selects a header timeout no greater than the overall request receive timeout.
   * @param supplied Optional explicit header timeout in milliseconds.
   * @param requestTimeoutMs Overall request receive timeout in milliseconds.
   * @returns Explicit timeout or the lesser of the default and request timeout.
   * @throws {TypeError} If the selected header timeout exceeds requestTimeoutMs.
   */
  private static headersTimeout(supplied: number | undefined, requestTimeoutMs: number): number {
    const timeout = supplied ?? Math.min(DEFAULT_HEADERS_TIMEOUT_MS, requestTimeoutMs);
    if (timeout > requestTimeoutMs)
      throw new TypeError("Header receive limit exceeds request receive limit");
    return timeout;
  }

  /**
   * Validates the authentication callback and creates its HTTP challenge header value.
   * @param authentication Optional authentication contract and challenge configuration.
   * @returns Challenge header value, or undefined when authentication is disabled.
   * @throws {TypeError} If the callback, scheme, or supplied realm is invalid.
   */
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

  /**
   * Copies mutable caller-owned option records while retaining callback and controller identities.
   * @param options Validated options whose mutable records must be detached.
   * @returns Frozen option snapshot preserving controller and callback identities.
   */
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

  /**
   * Creates a configured server without constructing controllers or starting a listener.
   * @param options IHttpServerOptions with controller instances, hooks, and optional limits.
   * @returns Configured one-use HTTP server with no listener started.
   */
  public static create(options: IHttpServerOptions): HttpServer {
    return new HttpServer(options);
  }

  /**
   * Returns frozen registration metadata without exposing callbacks, instances, or transport state.
   * @returns Immutable controller identities, error mappings, and authentication presence.
   */
  public get registration(): IHttpServerRegistration {
    return this.state.registrationValue;
  }

  /**
   * Starts the listener once; port zero requests an OS-assigned ephemeral port.
   * @param options IHttpListenOptions; omitted host uses Node semantics, and port zero is ephemeral.
   * @returns Promise fulfilled with no value when listening, or rejected if startup fails.
   * @throws {Error} If listen was already attempted or the server was closed.
   * @throws {TypeError} If port is not an integer in 0-65535 or host is empty or non-string.
   * @throws {unknown} If native listener startup fails or is cancelled.
   */
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

  /**
   * Returns a frozen bound address while listening, or undefined before a TCP address exists.
   * @returns Detached host and port while bound; otherwise undefined.
   */
  public address(): IHttpAddress | undefined {
    const address = this.state.server?.address();
    if (typeof address !== "object" || address === null) return undefined;
    return Object.freeze({ host: address.address, port: address.port });
  }

  /**
   * Closes idempotently, including before listen, and shares the single shutdown promise.
   * @returns Shared promise for shutdown; it rejects if owned transport, work, or logs fail to drain.
   */
  public close(): Promise<void> {
    this.state.isClosed = true;
    if (this.state.closePromise !== undefined) return this.state.closePromise;
    this.state.closePromise = this.shutdown();
    return this.state.closePromise;
  }

  /**
   * Stops acceptance and bounds draining; timed-out handlers are aborted and sockets destroyed.
   * @returns Promise fulfilled after shutdown or rejected when draining fails or times out.
   * @throws {Error} If request, transport, or logging drain exceeds the shutdown timeout.
   * @throws {unknown} If the underlying transport, request, or log drain rejects.
   */
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

  /**
   * Waits for transport closure, active request work, and queued response logs in dependency order.
   * @param transport Promise tracking native listener closure.
   * @returns Promise fulfilled after transport, handlers, and logs drain; rejects if any drain rejects.
   */
  private async drain(transport: Promise<void>): Promise<void> {
    await transport;
    await Promise.all(this.state.active.values());
    await this.state.logs.drain();
  }

  /**
   * Queues each request per socket and tracks its handler until processing settles.
   * @param incoming Native parsed request to process.
   * @param outgoing Native response to complete or destroy.
   * @param isContinue Whether request has Expect: 100-continue; defaults to false.
   * @param isExpectationRejected Whether expectation is unsupported; defaults to false.
   * @returns No value; schedules request handling or destroys requests after close.
   */
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

  /**
   * Ends malformed parser input with a bounded status response or destroys an unsafe socket.
   * @param error Native HTTP parser error and optional parser code.
   * @param socket Duplex connection on which parsing failed.
   * @returns No value; ends or destroys the affected socket.
   */
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

  /**
   * Runs request processing, converts unexpected failures to a secret-safe 500 response, and logs them.
   * @param incoming Parsed native request.
   * @param outgoing Native response for this request.
   * @param abort Request cancellation controller.
   * @param isContinue Whether the client requested 100-continue.
   * @param isExpectationRejected Whether the client's expectation was rejected.
   * @returns Promise settled after request processing and failure handling finish.
   */
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

  /**
   * Executes normalization, authentication, binding, controller invocation, and response writing.
   * @param incoming Parsed native request.
   * @param outgoing Native response for this request.
   * @param abort Signal passed to the domain request.
   * @param requestId Stable identifier used in response and diagnostics.
   * @param completion Response accounting for this request.
   * @param context Mutable diagnostic phase and route state.
   * @param isContinue Whether the client requested 100-continue.
   * @param isExpectationRejected Whether the client's expectation was rejected.
   * @returns Promise settling after response processing or an early handled rejection.
   */
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

  /**
   * Selects a route and rejects invalid targets, headers, cookies, expectations, and methods.
   * @param incoming Parsed native request.
   * @param outgoing Native response for this request.
   * @param requestId Stable request identifier for generated responses.
   * @param completion Response accounting updated when a route matches.
   * @param context Mutable diagnostic phase and route state.
   * @param isContinue Whether the client requested 100-continue.
   * @param isExpectationRejected Whether the client's expectation was rejected.
   * @returns Validated request parts, or undefined when a response was already sent.
   */
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

  /**
   * Parses the raw target under byte, pair-count, and nesting-depth limits.
   * @param incoming Parsed native request containing the raw URL.
   * @param outgoing Native response used for target rejection.
   * @param requestId Stable identifier for a rejection response.
   * @returns Parsed target or undefined after sending its rejection response.
   */
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

  /**
   * Parses Node's raw header pairs into the validated request-header value.
   * @param incoming Parsed native request containing raw header pairs.
   * @param outgoing Native response used for header rejection.
   * @param requestId Stable identifier for a rejection response.
   * @returns Validated headers or undefined after sending a rejection response.
   */
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

  /**
   * Parses all Cookie header values into a validated cookie value.
   * @param headers Validated headers containing zero or more Cookie values.
   * @param outgoing Native response used for cookie rejection.
   * @param requestId Stable identifier for a rejection response.
   * @returns Validated cookies or undefined after sending a rejection response.
   */
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

  /**
   * Completes a matching OPTIONS request and indicates whether it was handled.
   * @param incoming Parsed native request to inspect.
   * @param outgoing Native response to complete when method is OPTIONS.
   * @param requestId Stable identifier included in a handled response.
   * @param match Matched route group and its allowed methods.
   * @param headers Validated headers used to detect a request body.
   * @param isContinue Whether the client requested 100-continue.
   * @returns True when an OPTIONS response was sent; otherwise false.
   */
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

  /**
   * Creates the domain request from validated transport values and the request abort signal.
   * @param incoming Parsed native request providing method, URL, and peer address.
   * @param abort Request cancellation controller.
   * @param requestId Stable identifier assigned to this request.
   * @param prepared Validated target, route, headers, and cookies.
   * @returns Domain request containing normalized transport data and cancellation signal.
   */
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

  /**
   * Authenticates protected endpoints and records only the resulting user identity.
   * @param request Normalized request passed to the configured authenticator.
   * @param endpoint Matched endpoint metadata, including its public-access flag.
   * @param outgoing Native response used for authentication rejection.
   * @param requestId Stable identifier included in rejection responses.
   * @param completion Response accounting that receives the authenticated identity.
   * @returns Promise resolving to identity (undefined if inapplicable) or a handled rejection.
   * @throws {Error} If authentication returns a value that is not a nonempty string.
   */
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

  /**
   * Reads and binds request input, returning controller arguments or an already-sent rejection.
   * @param incoming Parsed native request whose body may be read.
   * @param outgoing Native response used for input rejection.
   * @param prepared Validated request target, route, headers, and cookies.
   * @param request Normalized request supplied to parameter binding.
   * @param userId Authenticated identity, when authentication produced one.
   * @param requestId Stable identifier included in rejection responses.
   * @param isContinue Whether the client requested 100-continue.
   * @returns Promise resolving to bound arguments/body-read flag or undefined after rejection.
   */
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

  /**
   * Reads a bounded body when required and writes the corresponding input rejection on failure.
   * @param incoming Parsed native request body stream.
   * @param outgoing Native response used for body rejection.
   * @param requestId Stable identifier included in rejection responses.
   * @param hasBodyBinder Whether the endpoint declares a body parameter.
   * @param shouldReadBody Whether framing requires consuming body bytes.
   * @param isContinue Whether the client requested 100-continue.
   * @returns Promise resolving to parsed JSON, unbound undefined, or a rejection marker.
   */
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

  /**
   * Invokes the matched controller and translates configured controller errors into HTTP responses.
   * @param selected Matched route and controller instance.
   * @param endpoint Metadata defining response declarations and error mappings.
   * @param arguments_ Validated arguments supplied to the controller method.
   * @param outgoing Native response used for mapped errors.
   * @param requestId Stable identifier included in error responses.
   * @param completion Response accounting marked on server-side errors.
   * @param context Current phase and route for diagnostics.
   * @returns Promise resolving to handled marker or controller value; rejects for unmapped errors.
   * @throws {unknown} If controller failure has no configured error mapping.
   */
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

  /**
   * Validates the controller result against declared statuses and commits its serialized response.
   * @param result Value returned by the controller.
   * @param prepared Matched request and endpoint metadata.
   * @param request Normalized request used for diagnostics.
   * @param outgoing Native response to commit.
   * @param requestId Stable identifier included in the response.
   * @param completion Response accounting for this request.
   * @param context Current phase and route for diagnostics.
   * @param isContinue Whether the client requested 100-continue.
   * @param shouldReadBody Whether this request consumed its body.
   * @returns No value; writes the normalized response to the native transport.
   * @throws {Error} If a non-HttpResponse value is returned.
   * @throws {Error} If the response status is absent from endpoint declarations.
   */
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

  /**
   * Projects response values through the declared DTO schema and serializes JSON.
   * @param declaration Endpoint declaration for the response status and DTO type.
   * @param value Controller response body to project.
   * @param request Normalized request used for diagnostics.
   * @param requestId Stable identifier included in fallback responses.
   * @param outgoing Native response used after serialization failure.
   * @param completion Response accounting marked on serialization failure.
   * @param context Current phase and route for diagnostics.
   * @returns JSON text, empty text for status 204, or undefined after fallback response.
   * @throws {Error} If an array response declaration receives a non-array value.
   */
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

  /**
   * Marks output failure, reports schema issues without values, and sends an internal problem response.
   * @param issues Safe schema paths and codes; raw invalid values are excluded.
   * @param request Normalized request supplying method and request identity.
   * @param requestId Stable identifier included in the fallback response.
   * @param outgoing Native response to complete with an internal error.
   * @param completion Response accounting marked as failed.
   * @param context Current phase and route for diagnostics.
   * @returns No value; reports the failure and writes a 500 problem response.
   */
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

  /**
   * Emits an RFC 9457 problem response without exposing exception messages or raw input values.
   * @param outgoing Native response to complete if its socket remains writable.
   * @param requestId Stable identifier included in the problem document.
   * @param status HTTP status code for this problem.
   * @param issues Safe validation issues to include; defaults to an empty list.
   * @param shouldClose Whether to reject socket reuse; defaults to false.
   * @param mapping Optional declared error mapping for type, title, and detail.
   * @returns No value; commits a problem response unless the socket is already unusable.
   */
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

  /**
   * Ends the response and accounts only payload bytes handed to Node, not delivery confirmation.
   * @param outgoing Native response to end unless the response or socket is destroyed.
   * @param body Serialized response text before HEAD suppression.
   * @returns No value; ends the response and records handed-off payload bytes.
   */
  private send(outgoing: ServerResponse, body: string): void {
    if (outgoing.destroyed || outgoing.req.socket.destroyed) return;
    const payload = outgoing.req.method === "HEAD" ? "" : body;
    outgoing.end(payload);
    this.state.completions.get(outgoing)?.handOff(Buffer.byteLength(payload));
  }

  /**
   * Calls the synchronous diagnostic hook with sanitized errors and observes invalid hook behavior.
   * @param error Unknown failure to sanitize before notification.
   * @param context Secret-safe request phase and route context.
   * @returns No value; invokes the hook and warns if it throws or returns a promise.
   */
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

/** Tracks the current request phase and route for secret-safe diagnostics. */
interface IRequestContextState {
  /** Context updated as request processing advances through its phases. */
  current: IHttpErrorContext;
}

/** Contains the validated target, matched route, and normalized headers and cookies. */
interface IPreparedRequest {
  /** Parsed path and query values for this request. */
  readonly target: Extract<ReturnType<typeof RequestTarget.parse>, { readonly ok: true }>["value"];
  /** Unique route and controller selected for the parsed path and method. */
  readonly selected: NonNullable<NonNullable<ReturnType<PreparedRoutes["match"]>>["selected"]>;
  /** Validated headers supplied to request binding. */
  readonly headers: RequestHeaders;
  /** Validated cookies supplied to request binding. */
  readonly cookies: RequestCookies;
}
