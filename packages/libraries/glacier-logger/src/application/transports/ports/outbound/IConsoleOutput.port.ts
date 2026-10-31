/** Browser console methods used by the console transport. */
export interface IConsoleOutput {
  /** Sends debug-level data to the console.
   * @param data Values supplied as console arguments.
   * @returns No value; writes one console entry.
   */
  debug(...data: unknown[]): void;
  /** Sends informational data to the console.
   * @param data Values supplied as console arguments.
   * @returns No value; writes one console entry.
   */
  info(...data: unknown[]): void;
  /** Sends warning data to the console.
   * @param data Values supplied as console arguments.
   * @returns No value; writes one console entry.
   */
  warn(...data: unknown[]): void;
  /** Sends error data to the console.
   * @param data Values supplied as console arguments.
   * @returns No value; writes one console entry.
   */
  error(...data: unknown[]): void;
}
