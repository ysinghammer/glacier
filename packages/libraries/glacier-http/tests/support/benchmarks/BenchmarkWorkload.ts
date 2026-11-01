import type { IHttpResponseLogRecord } from "@glacier/http";
import type { BenchmarkOutputDto } from "./BenchmarkOutput.dto.js";

/** Shared deterministic application/authentication/logging work with no external I/O. */
export class BenchmarkWorkload {
  /** Number of response-log records accepted by this workload. @default 0 */
  private logs = 0;
  /** Aggregate serialized response-body bytes recorded by the workload. @default 0 */
  private bytes = 0;
  /** Unexpected diagnostics reported during the workload. @default 0 */
  private diagnostics = 0;
  /** Highest periodic RSS sample in bytes, initially sampled from the current process. */
  private maxRss = process.memoryUsage().rss;

  /**
   * Accepts the fixed benchmark bearer credential without performing token verification.
   * @param authorization Raw authorization header or `undefined` when absent.
   * @returns Fixture actor id for the expected credential, otherwise `undefined`.
   */
  public static authenticate(authorization: string | undefined): string | undefined {
    if (authorization === "Bearer benchmark") return "actor";
    return undefined;
  }

  /**
   * Builds benchmark output with one undeclared field to verify projection.
   * @param id Item identifier.
   * @param userId Authenticated actor identifier.
   * @param count Validated integer count.
   * @param label Query/body label selected by the caller.
   * @returns Output DTO data including an extra field that must not reach the wire.
   */
  public static output(
    id: string,
    userId: string,
    count: number,
    label: string,
  ): BenchmarkOutputDto {
    const value = { id, userId, count, label, excluded: "not-on-wire" };
    return value;
  }

  /**
   * Accumulates log count and body bytes, sampling RSS every hundred records.
   * @param record Public response-log record being measured.
   * @returns No value; updates workload counters and possibly the sampled RSS maximum.
   */
  public log(record: IHttpResponseLogRecord): void {
    this.logs++;
    this.bytes += record.bodyBytes;
    if (this.logs % 100 === 0) this.maxRss = Math.max(this.maxRss, process.memoryUsage().rss);
  }

  /**
   * Counts one unexpected server diagnostic for later benchmark validation.
   * @returns No value; increments the diagnostic count.
   */
  public diagnose(): void {
    this.diagnostics++;
  }

  /**
   * Captures current counters and process memory for the benchmark IPC channel.
   * @returns Snapshot object; RSS is a periodic sample, not an operating-system peak.
   */
  public snapshot(): object {
    return {
      logs: this.logs,
      bytes: this.bytes,
      diagnostics: this.diagnostics,
      memory: process.memoryUsage(),
      maxSampledRss: this.maxRss,
    };
  }
}
