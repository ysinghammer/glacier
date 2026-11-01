/** Completion metadata only; bytes were handed to transport, not proven delivered to the client. */
export interface IHttpResponseLogRecord {
  /** Correlation identifier for this request. */
  readonly requestId: string;
  /** HTTP method received by the server. */
  readonly method: string;
  /** Matched route template; absent when no route was selected. */
  readonly route?: string;
  /** Authenticated identity; absent when authentication did not produce one. */
  readonly userId?: string;
  /** Final status when a response status was selected. */
  readonly status?: number;
  /** Elapsed request duration in milliseconds. */
  readonly durationMs: number;
  /** Number of response-body bytes handed to the transport. */
  readonly bodyBytes: number;
  /** Completion state; completed does not prove client receipt. */
  readonly outcome: "completed" | "disconnected" | "failed";
}
