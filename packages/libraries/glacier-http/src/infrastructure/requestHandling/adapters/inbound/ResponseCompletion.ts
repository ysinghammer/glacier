import type { ServerResponse } from "node:http";
import type { IHttpResponseLogRecord } from "../../../../domain/requestHandling/server/IHttpResponseLogRecord.js";

/** Accounts native response completion once and emits a detached response-log record. */
export class ResponseCompletion {
  /**
   * High-resolution construction timestamp in milliseconds, used for elapsed duration.
   */
  private readonly started = performance.now();
  /** Stable identifier associated with the request and its log record. */
  private readonly requestId: string;
  /** HTTP method associated with the request and its log record. */
  private readonly method: string;
  /** Native response inspected for completion, status, and byte accounting. */
  private readonly response: ServerResponse;
  /**
   * Sink receiving the completed immutable log record.
   * @param record Frozen response-log record created at completion.
   * @returns No value; forwards the record to the owning log queue.
   */
  private readonly write: (record: IHttpResponseLogRecord) => void;
  /**
   * Prevents finish and close events from producing duplicate records.
   * @default false
   */
  private hasCompleted = false;
  /**
   * Number of response-body bytes handed to Node, excluding HEAD payloads.
   * @default 0 bytes
   */
  private bodyBytes = 0;
  /**
   * Matched route template, absent when routing did not select an endpoint.
   * @default undefined
   */
  private route: string | undefined;
  /**
   * Validated authenticated user identity; credentials are never stored.
   * @default undefined
   */
  private userId: string | undefined;
  /**
   * Whether response logging is disabled for the matched endpoint.
   * @default false
   */
  private isSkipped = false;
  /**
   * Whether unexpected processing or serialization failed.
   * @default false
   */
  private hasFailed = false;

  /**
   * Observes native completion without exposing the response to the log sink.
   * @param response Native response whose finish and close events determine completion.
   * @param requestId Stable request identifier recorded in the log.
   * @param method HTTP method recorded in the log.
   * @param write Sink called once with a frozen record unless logging is skipped.
   */
  public constructor(
    response: ServerResponse,
    requestId: string,
    method: string,
    write: (record: IHttpResponseLogRecord) => void,
  ) {
    this.response = response;
    this.requestId = requestId;
    this.method = method;
    this.write = write;
    response.once("finish", () => {
      this.complete();
    });
    response.once("close", () => {
      this.complete();
    });
  }

  /**
   * Records matched endpoint identity and logging exclusion before authentication or input work.
   * @param route Matched route template.
   * @param isSkipped Whether this endpoint excludes response logging.
   * @returns No value; updates the completion record's route and exclusion state.
   */
  public match(route: string, isSkipped: boolean): void {
    this.route = route;
    this.isSkipped = isSkipped;
  }

  /**
   * Records a validated identity, never credentials.
   * @param userId Authenticated user ID, or undefined when authentication is not applicable.
   * @returns No value; stores the identity for the eventual log record.
   */
  public authenticate(userId: string | undefined): void {
    this.userId = userId;
  }

  /**
   * Adds the supplied payload-byte count; callers supply zero for HEAD responses.
   * @param bytes Number of payload bytes handed to the native response.
   * @returns No value; increases the body-byte count used in the log record.
   */
  public handOff(bytes: number): void {
    this.bodyBytes += bytes;
  }

  /**
   * Marks unexpected processing failure while retaining any committed response status.
   * @returns No value; changes the eventual log outcome to failed unless disconnected.
   */
  public fail(): void {
    this.hasFailed = true;
  }

  /**
   * Emits once unless skipped; includes status only after headers commit and records the outcome.
   * @returns No value; sends an immutable record unless logging was skipped.
   */
  private complete(): void {
    if (this.hasCompleted) return;
    this.hasCompleted = true;
    if (this.isSkipped) return;
    let outcome: IHttpResponseLogRecord["outcome"] = "completed";
    if (!this.response.writableFinished) outcome = "disconnected";
    else if (this.hasFailed) outcome = "failed";
    this.write(
      Object.freeze({
        requestId: this.requestId,
        method: this.method,
        ...(this.route === undefined ? {} : { route: this.route }),
        ...(this.userId === undefined ? {} : { userId: this.userId }),
        ...(this.response.headersSent ? { status: this.response.statusCode } : {}),
        durationMs: performance.now() - this.started,
        bodyBytes: this.bodyBytes,
        outcome,
      }),
    );
  }
}
