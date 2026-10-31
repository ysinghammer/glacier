import type { IHttpResponseLogRecord } from "../../domain/requestHandling/server/IHttpResponseLogRecord.js";
import type { IHttpErrorContext } from "../../domain/requestHandling/server/IHttpErrorContext.js";

/** Supervises response logging; asynchronous logger completion is independent of transmission. */
export class ResponseLogs {
  /** Promises currently supervised until settlement; drained by the resource owner.
   * @default Empty set.
   */
  private readonly pending = new Set<Promise<void>>();

  /** Optional logger; undefined disables logging. Its returned work is supervised, not awaited here.
   * @param record - Response accounting record supplied to the logger.
   * @returns No value or a promise whose completion is supervised.
   */
  private readonly hook: ((record: IHttpResponseLogRecord) => void | Promise<void>) | undefined;

  /** Maximum number of outstanding logger promises, supplied by validated server composition. */
  private readonly limit: number;

  /** Reports logger failures and overflow with request context.
   * @param error - Synchronous logger failure, rejected promise reason, or overflow error.
   * @param context - Frozen request and response-logging phase context.
   * @returns No value; reports the supplied diagnostic.
   */
  private readonly diagnose: (error: unknown, context: IHttpErrorContext) => void;

  /** Stores the logger, queue bound, and diagnostic callback without starting resources.
   * @param hook - Optional logger; undefined disables response logging.
   * @param limit - Positive bound on concurrently pending logger promises.
   * @param diagnose - Callback used to report overflow and logger failures.
   */
  public constructor(
    hook: ((record: IHttpResponseLogRecord) => void | Promise<void>) | undefined,
    limit: number,
    diagnose: (error: unknown, context: IHttpErrorContext) => void,
  ) {
    this.hook = hook;
    this.limit = limit;
    this.diagnose = diagnose;
  }

  /** Invokes a configured logger once synchronously and supervises its asynchronous work.
   * @param record - Accounting data for the completed HTTP response.
   * @returns No value; diagnoses overflow instead of invoking a full queue.
   */
  public write(record: IHttpResponseLogRecord): void {
    if (this.hook === undefined) return;
    const context: IHttpErrorContext = Object.freeze({
      requestId: record.requestId,
      method: record.method,
      ...(record.route === undefined ? {} : { route: record.route }),
      phase: "response-logging",
    });
    if (this.pending.size >= this.limit) {
      this.diagnose(new Error("HTTP response logging overflow"), context);
      return;
    }
    try {
      const result = this.hook(record);
      if (result === undefined) return;
      const pending = Promise.resolve(result).then(
        () => {
          this.pending.delete(pending);
        },
        (error: unknown) => {
          this.pending.delete(pending);
          this.diagnose(error, context);
        },
      );
      this.pending.add(pending);
    } catch (error: unknown) {
      this.diagnose(error, context);
    }
  }

  /** Waits for all currently tracked logger work; the resource owner applies the shared shutdown bound.
   * @returns A promise settling after tracked work; diagnostic callback failures reject it.
   */
  public async drain(): Promise<void> {
    await Promise.all(this.pending);
  }
}
