import { createServer, STATUS_CODES } from "node:http";
import type { IncomingMessage, ServerResponse, Server } from "node:http";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { Schema, SchemaError, SchemaDefinitionError } from "@glacier/schema";
import { PreparedRoutes } from "../../../application/PreparedRoutes.js";
import { RequestBinding } from "../../../application/RequestBinding.js";
import { RequestBody } from "./RequestBody.adapter.js";
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
import type { IHttpInputIssue } from "../../../domain/requests/IHttpInputIssue.js";
import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpServerRegistration } from "../../../domain/server/IHttpServerRegistration.js";
import type { IHttpErrorMapping } from "../../../domain/responses/IHttpErrorMapping.js";
import { ErrorMappings } from "../../../domain/responses/ErrorMappings.js";
import { ResponseLogs } from "../../../application/ResponseLogs.js";
import { ResponseCompletion } from "./ResponseCompletion.js";
import { HttpContractError } from "../../../domain/responses/HttpContract.error.js";

const CHALLENGE_SCHEME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const CHALLENGE_REALM = /^[\x20-\x21\x23-\x5b\x5d-\x7e]*$/;
const DEFAULT_BODY_BYTES = 1_048_576;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const MAX_NODE_RECEIVE_LIMIT = 2_147_483_647;
const DEFAULT_PENDING_RESPONSE_LOGS = 1_000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;

/** Explicit one-use Node HTTP/1.1 lifecycle with no import-time resources or controller ownership. */
export class HttpServer {
  readonly #registration: IHttpServerRegistration;
  readonly #logs: ResponseLogs;
  readonly #completions = new WeakMap<ServerResponse, ResponseCompletion>();
  readonly #routes: PreparedRoutes;
  readonly #options: IHttpServerOptions;
  readonly #challenge: string | undefined;
  readonly #bodyBytes: number;
  readonly #requestTimeoutMs: number;
  #server: Server | undefined;
  #hasListened = false;
  #isClosed = false;
  #closePromise: Promise<void> | undefined;

  /** Prepares metadata only; construction never opens a listener. */
  private constructor(options: IHttpServerOptions) {
    if (!Array.isArray(options.controllers) || typeof options.onError !== "function")
      throw new TypeError("Invalid server options");
    this.#routes = new PreparedRoutes(
      [...options.controllers],
      options.authentication !== undefined,
    );
    this.#bodyBytes = options.limits?.bodyBytes ?? DEFAULT_BODY_BYTES;
    this.#requestTimeoutMs = options.limits?.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    const pendingResponseLogs =
      options.limits?.pendingResponseLogs ?? DEFAULT_PENDING_RESPONSE_LOGS;
    const shutdownTimeoutMs = options.limits?.shutdownTimeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS;
    for (const limit of [
      this.#bodyBytes,
      this.#requestTimeoutMs,
      pendingResponseLogs,
      shutdownTimeoutMs,
    ]) {
      if (!Number.isSafeInteger(limit) || limit <= 0 || limit > MAX_NODE_RECEIVE_LIMIT)
        throw new TypeError("Invalid body receive limit");
    }
    if (options.onResponseLog !== undefined && typeof options.onResponseLog !== "function")
      throw new TypeError("Invalid response logging hook");
    this.#registration = Object.freeze({
      // PreparedRoutes already validates these constructor identities through public reflection.
      controllers: Object.freeze(
        options.controllers.map(
          (controller) => controller.constructor as IConstructableClass<object>,
        ),
      ),
      errorMappings: ErrorMappings.prepare(options.errorMappings ?? []),
      hasAuthentication: options.authentication !== undefined,
    });
    this.#logs = new ResponseLogs(
      options.onResponseLog,
      pendingResponseLogs,
      shutdownTimeoutMs,
      (error, context) => {
        this.#diagnose(error, context);
      },
    );
    const authentication = options.authentication;
    if (authentication !== undefined) {
      if (
        typeof authentication.authenticate !== "function" ||
        authentication.challenge === undefined ||
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

  /** Detached immutable composition for documentation consumers; contains no resources or callbacks. */
  public get registration(): IHttpServerRegistration {
    return this.#registration;
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
    server.requestTimeout = this.#requestTimeoutMs;
    server.on("checkContinue", (request, response) => {
      void this.#handle(request, response, true);
    });
    server.on("checkExpectation", (request, response) => {
      void this.#handle(request, response, false, true);
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
      this.#closePromise = this.#logs.drain();
    } else {
      this.#closePromise = promisify(server.close.bind(server))().then(() => this.#logs.drain());
    }
    return this.#closePromise;
  }

  /** Supervises every request failure and commits only normalized, schema-validated responses. */
  async #handle(
    incoming: IncomingMessage,
    outgoing: ServerResponse,
    isContinue = false,
    isExpectationRejected = false,
  ): Promise<void> {
    const requestId = randomUUID();
    const abort = new AbortController();
    const completion = new ResponseCompletion(
      outgoing,
      requestId,
      String(incoming.method),
      (record) => {
        this.#logs.write(record);
      },
    );
    this.#completions.set(outgoing, completion);
    outgoing.once("close", () => {
      if (!outgoing.writableFinished) abort.abort();
    });
    let context: IHttpErrorContext = { requestId, method: String(incoming.method), phase: "input" };
    try {
      const targetResult = RequestTarget.parse(String(incoming.url));
      if (!targetResult.ok) {
        this.#problem(outgoing, requestId, targetResult.status, [], true);
        return;
      }
      const target = targetResult.value;
      const match = this.#routes.match(target.pathname, String(incoming.method));
      const selected = match?.selected;
      if (selected !== undefined) {
        const endpoint = selected.route.metadata;
        completion.match(endpoint.template, endpoint.isResponseLoggingSkipped);
        context = { ...context, route: endpoint.template };
      }
      if (isExpectationRejected) {
        this.#problem(outgoing, requestId, 417, [], true);
        return;
      }
      const headersResult = RequestHeaders.parse(incoming.rawHeaders);
      if (!headersResult.ok) {
        this.#problem(outgoing, requestId, headersResult.status, [], true);
        return;
      }
      const headers = headersResult.value;
      const cookiesResult = RequestCookies.parse(headers.getAll("cookie"));
      if (!cookiesResult.ok) {
        this.#problem(outgoing, requestId, cookiesResult.status, [], true);
        return;
      }
      const cookies = cookiesResult.value;
      if (match === undefined) {
        this.#problem(outgoing, requestId, 404, [], true);
        return;
      }
      if (incoming.method === "OPTIONS") {
        outgoing.setHeader("Allow", match.allow);
        outgoing.setHeader("X-Request-Id", requestId);
        if (
          isContinue ||
          Number(headers.get("content-length")) > 0 ||
          headers.get("transfer-encoding") !== undefined
        )
          outgoing.setHeader("Connection", "close");
        outgoing.statusCode = 204;
        outgoing.end();
        return;
      }
      if (selected === undefined) {
        outgoing.setHeader("Allow", match.allow);
        this.#problem(outgoing, requestId, 405, [], true);
        return;
      }
      const endpoint = selected.route.metadata;
      const route = endpoint.template;
      context = { ...context, route };
      const request = HttpRequest[REQUEST_CREATION]({
        requestId,
        method: String(incoming.method),
        url: String(incoming.url),
        pathname: target.pathname,
        route,
        params: selected.params,
        query: target.query,
        remoteAddress: incoming.socket.remoteAddress,
        signal: abort.signal,
        headers,
        cookies,
      });
      context = { ...context, phase: "authentication" };
      let userId: string | undefined;
      if (this.#options.authentication !== undefined && !endpoint.isPublic) {
        userId = await this.#options.authentication.authenticate(request);
        if (userId === undefined) {
          outgoing.setHeader("WWW-Authenticate", String(this.#challenge));
          this.#problem(outgoing, requestId, 401, [], true);
          return;
        }
        if (typeof userId !== "string" || userId.length === 0)
          throw new Error("Invalid authentication result");
      }
      completion.authenticate(userId);
      context = { ...context, phase: "input" };
      const hasBodyBinder = endpoint.bindings.some((binding) => binding.location === "body");
      const preflight = RequestBody.preflight(headers, hasBodyBinder, this.#bodyBytes);
      if (preflight !== undefined) {
        this.#problem(outgoing, requestId, preflight, [], true);
        return;
      }
      let bodyInput: unknown;
      const shouldReadBody = hasBodyBinder || headers.get("transfer-encoding") !== undefined;
      if (shouldReadBody) {
        if (isContinue) outgoing.writeContinue();
        const bodyResult = await RequestBody.read(
          incoming,
          this.#bodyBytes,
          this.#requestTimeoutMs,
          hasBodyBinder,
        );
        if (!bodyResult.ok) {
          this.#problem(outgoing, requestId, bodyResult.status, [], true);
          return;
        }
        bodyInput = bodyResult.value;
      }
      const binding = RequestBinding.bind(
        endpoint.bindings,
        request,
        bodyInput,
        headers.toRecord(),
        cookies.toRecord(),
        userId,
      );
      if (!binding.ok) {
        this.#problem(outgoing, requestId, 400, binding.issues);
        return;
      }
      context = { ...context, phase: "controller" };
      let result: unknown;
      try {
        result = await Reflect.apply(
          selected.route.handler,
          selected.route.controller,
          binding.arguments,
        );
      } catch (error: unknown) {
        const mapping = ErrorMappings.resolve(error, [
          endpoint.endpointErrorMappings,
          endpoint.controllerErrorMappings,
          this.#registration.errorMappings,
        ]);
        if (mapping === undefined) throw error;
        if (mapping.status >= 500) {
          completion.fail();
          this.#diagnose(error, context);
        }
        this.#problem(outgoing, requestId, mapping.status, [], false, mapping);
        return;
      }
      context = { ...context, phase: "output" };
      if (result !== undefined && !(result instanceof HttpResponse))
        throw new Error("Invalid HTTP response result");
      const value =
        result === undefined ? HttpResponse.noContent()[RESPONSE_WIRE]() : result[RESPONSE_WIRE]();
      const declaration = endpoint.responses.find((response) => response.status === value.status);
      if (declaration === undefined) throw new Error("Undeclared response status");
      let body = "";
      if (declaration.status !== 204) {
        const values = declaration.isArray === true ? value.body : [value.body];
        if (!Array.isArray(values)) throw new Error("Expected DTO array");
        const projected = [];
        for (const item of values) {
          const serialized = Schema.safeSerialize(declaration.type, item);
          if (!serialized.ok) {
            completion.fail();
            this.#diagnose(new Error("Invalid response DTO"), {
              requestId,
              method: request.method,
              route,
              phase: "output",
              issues: Object.freeze(
                serialized.issues.map((issue) =>
                  Object.freeze({ path: Object.freeze([...issue.path]), code: issue.code }),
                ),
              ),
            });
            this.#problem(outgoing, requestId, 500);
            return;
          }
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
      if (isContinue && !shouldReadBody) outgoing.setHeader("Connection", "close");
      this.#send(outgoing, body);
    } catch (error: unknown) {
      completion.fail();
      this.#diagnose(error, context);
      this.#problem(outgoing, requestId, 500, [], true);
    }
  }

  /** Emits secret-safe RFC 9457 failures without exposing exception messages or raw values. */
  #problem(
    outgoing: ServerResponse,
    requestId: string,
    status: number,
    issues: readonly IHttpInputIssue[] = [],
    shouldClose = false,
    mapping?: IHttpErrorMapping,
  ): void {
    if (outgoing.destroyed) return;
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
    if (status === 401 && this.#challenge !== undefined)
      outgoing.setHeader("WWW-Authenticate", this.#challenge);
    outgoing.setHeader("X-Request-Id", requestId);
    outgoing.setHeader("Content-Type", "application/problem+json");
    outgoing.setHeader("Content-Length", Buffer.byteLength(body));
    if (shouldClose) outgoing.setHeader("Connection", "close");
    this.#send(outgoing, body);
  }

  /** Accounts only final body bytes actually handed to the native transport, never delivery. */
  #send(outgoing: ServerResponse, body: string): void {
    if (outgoing.destroyed) return;
    const payload = outgoing.req.method === "HEAD" ? "" : body;
    outgoing.end(payload);
    this.#completions.get(outgoing)?.handOff(Buffer.byteLength(payload));
  }

  /** Observes invalid diagnostic callbacks without recursion or credential-bearing fallback output. */
  #diagnose(error: unknown, context: IHttpErrorContext): void {
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
      const result: unknown = this.#options.onError(
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
