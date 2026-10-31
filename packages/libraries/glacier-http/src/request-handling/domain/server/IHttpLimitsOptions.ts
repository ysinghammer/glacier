/** Positive finite integer bounds; receive timeouts never impose a handler execution deadline. */
export interface IHttpLimitsOptions {
  readonly bodyBytes?: number;
  readonly headerBytes?: number;
  readonly requestTargetBytes?: number;
  readonly queryPairs?: number;
  readonly queryDepth?: number;
  readonly headersTimeoutMs?: number;
  readonly requestTimeoutMs?: number;
  readonly pendingResponseLogs?: number;
  readonly shutdownTimeoutMs?: number;
}
