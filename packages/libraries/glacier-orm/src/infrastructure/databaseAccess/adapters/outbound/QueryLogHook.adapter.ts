import { Logger } from "@glacier/logger";
import type { IQueryEvent } from "./IQueryEvent.js";
import type { IQueryLogHookOutcome } from "./IQueryLogHookOutcome.js";

/** Configures the inclusive slow-query threshold in milliseconds. */
export interface IQueryLogHookOptions {
  /** Finite nonnegative duration in milliseconds; zero marks every successful query slow. */
  readonly slowQueryMs: number;
}

/** Creates secret-conscious query observers for Glacier loggers. */
export class QueryLogHook {
  /** Logger receiving fixed messages and numeric duration only. */
  private readonly logger: Logger;

  /** Inclusive slow-query threshold in milliseconds. */
  private readonly slowQueryMs: number;

  /**
   * Retains a validated logger and threshold for the observer.
   * @param logger Glacier logger used to deliver entries.
   * @param slowQueryMs Finite nonnegative slow-query threshold in milliseconds.
   */
  private constructor(logger: Logger, slowQueryMs: number) {
    this.logger = logger;
    this.slowQueryMs = slowQueryMs;
  }

  /**
   * Validates configuration and creates an observer suitable for DbFactory's onQuery.
   * @param logger Factory-created Glacier logger.
   * @param options Required inclusive slow-query threshold.
   * @returns Created hook or a secret-free rejection reason.
   */
  public static create(logger: Logger, options: IQueryLogHookOptions): IQueryLogHookOutcome {
    if (!(logger instanceof Logger)) return { outcome: "rejected", reason: "invalid_logger" };
    const threshold = options?.slowQueryMs;
    if (typeof threshold !== "number" || !Number.isFinite(threshold) || threshold < 0) {
      return { outcome: "rejected", reason: "invalid_slow_query_ms" };
    }
    const adapter = new QueryLogHook(logger, threshold);
    return { outcome: "created", hook: (event) => adapter.observe(event) };
  }

  /**
   * Logs query completion without copying SQL, row counts, parameters, or errors.
   * @param event Database query event; duration must be finite and nonnegative.
   * @returns No value; emits at error, warn, or debug subject to logger filtering.
   * @throws {TypeError} If a manually supplied event has an invalid duration.
   */
  private observe(event: IQueryEvent): void {
    if (
      typeof event.durationMs !== "number" ||
      !Number.isFinite(event.durationMs) ||
      event.durationMs < 0
    ) {
      throw new TypeError("Invalid query duration");
    }
    const durationMs = event.durationMs;
    if (event.error !== undefined) {
      this.logger.error({ message: "Database query failed", durationMs });
      return;
    }
    if (durationMs >= this.slowQueryMs) {
      this.logger.warn({ message: "Slow database query", durationMs });
      return;
    }
    this.logger.debug({ message: "Database query completed", durationMs });
  }
}
