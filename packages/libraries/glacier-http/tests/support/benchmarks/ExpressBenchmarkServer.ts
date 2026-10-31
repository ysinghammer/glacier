import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createServer, STATUS_CODES } from "node:http";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { Schema } from "@glacier/schema";
import type { ISchemaIssue } from "@glacier/schema";
import type { IHttpAddress, IHttpListenOptions } from "@glacier/http";
import { BenchmarkBodyDto } from "./BenchmarkBody.dto.js";
import { BenchmarkQueryDto } from "./BenchmarkQuery.dto.js";
import { BenchmarkOutputDto } from "./BenchmarkOutput.dto.js";
import { BenchmarkWorkload } from "./BenchmarkWorkload.js";

/** Per-request logging metadata, never request/body/error data in the shared log callback. */
interface IRequestContext {
  readonly requestId: string;
  readonly started: number;
  readonly userId: string | undefined;
  bodyBytes: number;
}

/** Temporary typed baseline: equivalent measured routes/work, not Glacier protocol compatibility. */
export class ExpressBenchmarkServer {
  readonly #server: Server;
  readonly #workload: BenchmarkWorkload;
  readonly #contexts = new WeakMap<Request, IRequestContext>();

  /** Prepares the same schemas and explicitly assembles Express without starting a listener. */
  public constructor(workload: BenchmarkWorkload) {
    this.#workload = workload;
    Schema.prepare(BenchmarkBodyDto);
    Schema.prepare(BenchmarkQueryDto);
    Schema.prepare(BenchmarkOutputDto);
    const application = express();
    application.disable("x-powered-by");
    application.disable("etag");
    application.set("query parser", false);
    const route = application.route("/bench/items/:id");
    route.all((request, response, next) => this.prepare(request, response, next));
    route.get((request, response) => this.read(request, response));
    route.post(
      (request, response, next) => this.media(request, response, next),
      express.json({
        limit: 1_048_576,
        strict: true,
        inflate: false,
        type: ["application/json", "application/*+json"],
      }),
      (request, response) => this.write(request, response),
    );
    application.use((error: unknown, request: Request, response: Response, next: NextFunction) => {
      void next;
      this.bodyFailure(error, request, response);
    });
    this.#server = createServer({ maxHeaderSize: 16_384 }, application);
    this.#server.headersTimeout = 10_000;
    this.#server.requestTimeout = 30_000;
    this.#server.maxHeadersCount = 0;
  }

  /** Starts the native server on the same explicit loopback ephemeral binding. */
  public async listen(options: IHttpListenOptions): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.#server.once("error", reject);
      this.#server.listen(options.port, options.host, () => {
        this.#server.removeListener("error", reject);
        resolve();
      });
    });
  }

  /** Reports actual binding for the test-owned IPC coordinator. */
  public address(): IHttpAddress | undefined {
    const address = this.#server.address();
    if (address === null || typeof address === "string") return undefined;
    return { host: address.address, port: address.port };
  }

  /** Drains native requests before stopping; failures are not converted to successful close. */
  public async close(): Promise<void> {
    await new Promise<void>((resolve, reject) =>
      this.#server.close((error) => {
        if (error !== undefined) reject(error);
        else resolve();
      }),
    );
  }

  /** Runs the same auth stub before reading/validating body, installs UUID and completion logging. */
  private prepare(request: Request, response: Response, next: NextFunction): void {
    const context: IRequestContext = {
      requestId: randomUUID(),
      started: performance.now(),
      userId: BenchmarkWorkload.authenticate(request.get("authorization")),
      bodyBytes: 0,
    };
    this.#contexts.set(request, context);
    response.setHeader("X-Request-Id", context.requestId);
    response.once("finish", () =>
      this.#workload.log(
        Object.freeze({
          requestId: context.requestId,
          method: request.method,
          route: "/bench/items/:id",
          ...(context.userId === undefined ? {} : { userId: context.userId }),
          status: response.statusCode,
          durationMs: performance.now() - context.started,
          bodyBytes: context.bodyBytes,
          outcome: "completed",
        }),
      ),
    );
    if (context.userId === undefined) {
      response.setHeader("WWW-Authenticate", 'Bearer realm="benchmark"');
      this.problem(request, response, 401);
      return;
    }
    next();
  }

  /** Coerces the identical flat query DTO, strips unknown input and validates projected output. */
  private read(request: Request, response: Response): void {
    const url = new URL(request.originalUrl, "http://127.0.0.1");
    const query: Record<string, string | string[]> = Object.fromEntries<string | string[]>([]);
    for (const [key, value] of url.searchParams) {
      const previous = query[key];
      if (previous === undefined) query[key] = value;
      else if (typeof previous === "string") query[key] = [previous, value];
      else previous.push(value);
    }
    const result = Schema.safeParse(BenchmarkQueryDto, query, {
      coerce: true,
      coerceSingletonArrays: true,
    });
    if (!result.ok) {
      this.problem(request, response, 400, result.issues, "query");
      return;
    }
    this.output(request, response, result.value.count, "query");
  }

  /** Rejects unsupported JSON media/compression before the same strict-body validation. */
  private media(request: Request, response: Response, next: NextFunction): void {
    const media = request.get("content-type");
    if (
      request.get("content-encoding") !== undefined ||
      media === undefined ||
      !/^application\/(?:json|[a-z0-9!#$&^_.+-]+\+json)(?:;\s*charset=utf-8)?$/i.test(media)
    ) {
      this.problem(request, response, 415);
      return;
    }
    next();
  }

  /** Narrows Express's interop body through unknown and the identical constructor-free schema. */
  private write(request: Request, response: Response): void {
    const input: unknown = request.body;
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      this.problem(request, response, 400);
      return;
    }
    const result = Schema.safeParse(BenchmarkBodyDto, input);
    if (!result.ok) {
      this.problem(request, response, 400, result.issues, "body");
      return;
    }
    this.output(request, response, result.value.count, result.value.label);
  }

  /** Does the same logical work, output validation/projection, JSON serialization and wire headers. */
  private output(request: Request, response: Response, count: number, label: string): void {
    const context = this.#contexts.get(request);
    const id = request.params.id;
    if (context?.userId === undefined || typeof id !== "string")
      throw new Error("Missing baseline binding");
    const result = Schema.safeSerialize(
      BenchmarkOutputDto,
      BenchmarkWorkload.output(id, context.userId, count, label),
    );
    if (!result.ok) {
      this.#workload.diagnose();
      this.problem(request, response, 500);
      return;
    }
    const body = JSON.stringify(result.value);
    context.bodyBytes = Buffer.byteLength(body);
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Content-Length", context.bodyBytes);
    response.end(body);
  }

  /** Translates expected body-parser rejections without leaking body/error text. */
  private bodyFailure(error: unknown, request: Request, response: Response): void {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error.status === 400 || error.status === 413 || error.status === 415)
    ) {
      this.problem(request, response, error.status);
      return;
    }
    this.#workload.diagnose();
    this.problem(request, response, 500);
  }

  /** Emits only safe problem fields and location/path/code issues, never diagnostic values. */
  private problem(
    request: Request,
    response: Response,
    status: number,
    issues?: readonly ISchemaIssue[],
    location?: "query" | "body",
  ): void {
    const context = this.#contexts.get(request);
    if (context === undefined) throw new Error("Missing baseline context");
    const title = STATUS_CODES[status];
    const body = JSON.stringify({
      type: "about:blank",
      title,
      status,
      detail: title,
      requestId: context.requestId,
      ...(issues === undefined
        ? {}
        : { issues: issues.map((issue) => ({ location, path: issue.path, code: issue.code })) }),
    });
    context.bodyBytes = Buffer.byteLength(body);
    response.statusCode = status;
    response.setHeader("Content-Type", "application/problem+json");
    response.setHeader("Content-Length", context.bodyBytes);
    response.end(body);
  }
}
