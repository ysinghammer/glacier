/** Completed-body latency/load counters and client memory for one fixed-work sample. */
export interface IBenchmarkSample {
  readonly requests: number;
  readonly correct: number;
  readonly incorrect: number;
  readonly transportErrors: number;
  readonly bytes: number;
  readonly elapsedMs: number;
  readonly requestsPerSecond: number;
  readonly latencyMs: { readonly p50: number; readonly p95: number; readonly p99: number };
  readonly clientMemory: NodeJS.MemoryUsage;
}
