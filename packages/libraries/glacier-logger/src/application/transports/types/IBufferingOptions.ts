/** Limits controlling when buffered Node transport output is delivered. */
export interface IBufferingOptions {
  /** Byte threshold that triggers delivery; must be a positive integer.
   * @default 4096
   */
  readonly maxBufferBytes?: number;
  /** Maximum delivery delay in milliseconds; must be a positive integer.
   * @default 100
   */
  readonly flushIntervalMs?: number;
}
