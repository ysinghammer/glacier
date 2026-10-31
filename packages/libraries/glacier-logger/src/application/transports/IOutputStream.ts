/** A writable text stream such as `process.stdout`. */
export interface IOutputStream {
  /**
   * Writes `chunk` and calls `callback` once it has been handed over, with an error when that
   * failed. Waiting for the callback is what gives the writer backpressure.
   */
  write(chunk: string, callback: (error?: Error | null) => void): unknown;
}
