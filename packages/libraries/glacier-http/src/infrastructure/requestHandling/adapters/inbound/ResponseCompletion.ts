import type { ServerResponse } from "node:http";
import type { IHttpResponseLogRecord } from "../../../../domain/requestHandling/server/IHttpResponseLogRecord.js";

/** Native response accounting; finish and close share a single completion gate. */
export class ResponseCompletion {
  private readonly started = performance.now();
  private readonly requestId: string;
  private readonly method: string;
  private readonly response: ServerResponse;
  private readonly write: (record: IHttpResponseLogRecord) => void;
  private hasCompleted = false;
  private bodyBytes = 0;
  private route: string | undefined;
  private userId: string | undefined;
  private isSkipped = false;
  private hasFailed = false;

  /** Observes native completion without exposing the response to hooks. */
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

  /** Records matched endpoint identity and exclusion before authentication/input work. */
  public match(route: string, isSkipped: boolean): void {
    this.route = route;
    this.isSkipped = isSkipped;
  }

  /** Records a validated identity, never credentials. */
  public authenticate(userId: string | undefined): void {
    this.userId = userId;
  }

  /** Records only bytes passed to end after successful validation; HEAD passes zero. */
  public handOff(bytes: number): void {
    this.bodyBytes += bytes;
  }

  /** Marks unexpected processing failure; a successful error response still retains its actual status. */
  public fail(): void {
    this.hasFailed = true;
  }

  /** Emits exactly once; status is absent if final headers never committed. */
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
