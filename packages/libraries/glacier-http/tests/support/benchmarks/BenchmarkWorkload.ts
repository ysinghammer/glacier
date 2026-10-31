import type { IHttpResponseLogRecord } from "@glacier/http";
import type { BenchmarkOutputDto } from "./BenchmarkOutput.dto.js";

/** Shared deterministic application/authentication/logging work with no external I/O. */
export class BenchmarkWorkload {
  private logs = 0;
  private bytes = 0;
  private diagnostics = 0;
  private maxRss = process.memoryUsage().rss;

  /** Fixed authentication stub; intentionally not OIDC/token verification. */
  public static authenticate(authorization: string | undefined): string | undefined {
    if (authorization === "Bearer benchmark") return "actor";
    return undefined;
  }

  /** Returns logical fields plus an undeclared field that both transports must strip. */
  public static output(
    id: string,
    userId: string,
    count: number,
    label: string,
  ): BenchmarkOutputDto {
    const value = { id, userId, count, label, excluded: "not-on-wire" };
    return value;
  }

  /** Same synchronous metadata-only logging arithmetic, with periodic sampled RSS. */
  public log(record: IHttpResponseLogRecord): void {
    this.logs++;
    this.bytes += record.bodyBytes;
    if (this.logs % 100 === 0) this.maxRss = Math.max(this.maxRss, process.memoryUsage().rss);
  }

  /** Unexpected failures remain observable and invalidate the measured run. */
  public diagnose(): void {
    this.diagnostics++;
  }

  /** IPC snapshot, not an HTTP endpoint or a production API. RSS is sampled, not an OS peak. */
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
