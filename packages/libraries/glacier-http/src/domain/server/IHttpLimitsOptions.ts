/** Finite receive and logging-drain prerequisites; remaining transport limits arrive in phase 06. */
export interface IHttpLimitsOptions {
  readonly bodyBytes?: number;
  readonly requestTimeoutMs?: number;
  readonly pendingResponseLogs?: number;
  readonly shutdownTimeoutMs?: number;
}
