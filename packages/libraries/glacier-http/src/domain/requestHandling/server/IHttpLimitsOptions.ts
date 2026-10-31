/** Positive safe integers up to 2_147_483_647; receive limits do not bound handler execution. */
export interface IHttpLimitsOptions {
  /** Maximum accepted request-body bytes.
   * @default 1_048_576 bytes
   */
  readonly bodyBytes?: number;
  /** Maximum accepted aggregate request-header bytes.
   * @default 16_384 bytes
   */
  readonly headerBytes?: number;
  /** Maximum accepted encoded request-target bytes.
   * @default 8_192 bytes
   */
  readonly requestTargetBytes?: number;
  /** Maximum parsed query pairs, including repeated values.
   * @default 100 pairs
   */
  readonly queryPairs?: number;
  /** Maximum nested bracket-query depth.
   * @default 5 levels
   */
  readonly queryDepth?: number;
  /** Native timeout for receiving complete request headers, in milliseconds.
   * @default Lesser of 10_000 ms and requestTimeoutMs
   */
  readonly headersTimeoutMs?: number;
  /** Native timeout for receiving the complete request, in milliseconds.
   * @default 30_000 ms
   */
  readonly requestTimeoutMs?: number;
  /** Maximum queued/in-flight response-log callbacks.
   * @default 1_000 callbacks
   */
  readonly pendingResponseLogs?: number;
  /** Maximum graceful shutdown wait, in milliseconds.
   * @default 10_000 ms
   */
  readonly shutdownTimeoutMs?: number;
}
