import type { IHttpResponseLogRecord } from "../domain/server/IHttpResponseLogRecord.js";
import type { IHttpErrorContext } from "../domain/server/IHttpErrorContext.js";

/** Bounded supervision of injected access logging, independent of response transmission. */
export class ResponseLogs {
  readonly #pending = new Set<Promise<void>>();
  readonly #hook: ((record: IHttpResponseLogRecord) => void | Promise<void>) | undefined;
  readonly #limit: number;
  readonly #timeoutMs: number;
  readonly #diagnose: (error: unknown, context: IHttpErrorContext) => void;

  /** Retains validated composition only; starts no background resources. */
  public constructor(
    hook: ((record: IHttpResponseLogRecord) => void | Promise<void>) | undefined,
    limit: number,
    timeoutMs: number,
    diagnose: (error: unknown, context: IHttpErrorContext) => void,
  ) {
    this.#hook = hook;
    this.#limit = limit;
    this.#timeoutMs = timeoutMs;
    this.#diagnose = diagnose;
  }

  /** Calls at most once per accounting record and supervises every returned promise without awaiting it. */
  public write(record: IHttpResponseLogRecord): void {
    if (this.#hook === undefined) return;
    const context: IHttpErrorContext = Object.freeze({
      requestId: record.requestId,
      method: record.method,
      ...(record.route === undefined ? {} : { route: record.route }),
      phase: "response-logging",
    });
    if (this.#pending.size >= this.#limit) {
      this.#diagnose(new Error("HTTP response logging overflow"), context);
      return;
    }
    try {
      const result = this.#hook(record);
      if (result === undefined) return;
      const pending = Promise.resolve(result).then(
        () => {
          this.#pending.delete(pending);
        },
        (error: unknown) => {
          this.#pending.delete(pending);
          this.#diagnose(error, context);
        },
      );
      this.#pending.add(pending);
    } catch (error: unknown) {
      this.#diagnose(error, context);
    }
  }

  /** Drains the current work within a finite shutdown budget; abandoned promises stay supervised. */
  public async drain(): Promise<void> {
    if (this.#pending.size === 0) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        Promise.all(this.#pending),
        new Promise<never>((resolve, reject) => {
          void resolve;
          timer = setTimeout(() => {
            reject(new Error("HTTP response logging drain timed out"));
          }, this.#timeoutMs);
        }),
      ]);
    } catch (error: unknown) {
      this.#diagnose(error, { phase: "shutdown" });
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
