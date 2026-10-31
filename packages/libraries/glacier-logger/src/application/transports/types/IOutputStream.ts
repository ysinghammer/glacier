/** Minimal writable text-stream contract used by buffered output. */
export interface IOutputStream {
  /**
   * Writes text and invokes the completion callback when the stream accepts it.
   * @param chunk Text handed to the stream.
   * @param callback Completion notification; receives an error when the write fails.
   * @returns Stream-specific write result; completion is reported through `callback`.
   */
  write(chunk: string, callback: (error?: Error | null) => void): unknown;
}
