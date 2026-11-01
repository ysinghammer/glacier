/** Receives the fallback line when configured error handling is unavailable. */
export interface IDiagnosticsOutput {
  /** Writes one already formatted diagnostics line.
   * @param line Single-line message without a stack trace.
   * @returns No value; output failures are contained by the failure reporter.
   */
  write(line: string): void;
}
