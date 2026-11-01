/** Completed-body latency/load counters and client memory for one fixed-work sample. */
export interface IBenchmarkSample {
  /** Read-only count of HTTP requests included in the sample. */
  readonly requests: number;
  /** Read-only count matching expected status, headers, identity, and body. */
  readonly correct: number;
  /** Read-only count of completed responses failing expected-content checks. */
  readonly incorrect: number;
  /** Read-only count of requests failing at the transport layer. */
  readonly transportErrors: number;
  /** Read-only total response-body bytes consumed by the client. */
  readonly bytes: number;
  /** Read-only wall-clock duration in milliseconds for all sample requests. */
  readonly elapsedMs: number;
  /** Read-only completed request rate per second, derived from elapsed milliseconds. */
  readonly requestsPerSecond: number;
  /** Read-only nearest-rank response latencies in milliseconds after full body consumption. */
  readonly latencyMs: { readonly p50: number; readonly p95: number; readonly p99: number };
  /** Read-only reference to Node memory snapshot captured by the client after the sample. */
  readonly clientMemory: NodeJS.MemoryUsage;
}
