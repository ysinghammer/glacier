/** Tuning of the buffering Node transports. Both limits must be positive integers. */
export interface IBufferingOptions {
  /** Buffered bytes that trigger a write without waiting for the timer. Defaults to 4096. */
  readonly maxBufferBytes?: number;
  /** Longest time in milliseconds a line waits before it is written. Defaults to 100. */
  readonly flushIntervalMs?: number;
}
