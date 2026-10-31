/** Completion metadata only; bytes were handed to transport, not proven delivered to the client. */
export interface IHttpResponseLogRecord {
  readonly requestId: string;
  readonly method: string;
  readonly route?: string;
  readonly userId?: string;
  readonly status?: number;
  readonly durationMs: number;
  readonly bodyBytes: number;
  readonly outcome: "completed" | "disconnected" | "failed";
}
