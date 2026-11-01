import type { IDiagnosticsOutput } from "./ports/outbound/IDiagnosticsOutput.port.js";

const LINE_PREFIX = "[glacier-logger]";
const LINE_BREAKS = /\s*[\r\n]+\s*/g;

/** Reports failures to a handler or one sanitized line; diagnostics failures are dropped. */
export class FailureReporter {
  /**
   * Optional handler for isolated logging failures.
   * @param error Failure delivered to the configured callback.
   * @returns No value; a callback failure selects diagnostics fallback.
   */
  private readonly onError: ((error: Error) => void) | undefined;
  /** Output used when no handler exists or the handler throws. */
  private readonly diagnostics: IDiagnosticsOutput;

  /** Stores the reporting destinations without invoking either one.
   * @param onError Optional failure handler; undefined selects diagnostics output.
   * @param diagnostics Output used for the fallback message.
   */
  constructor(onError: ((error: Error) => void) | undefined, diagnostics: IDiagnosticsOutput) {
    this.onError = onError;
    this.diagnostics = diagnostics;
  }

  /** Delivers a failure to the handler or a message-only fallback line.
   * @param error Failure to report.
   * @returns No value; handler and diagnostics exceptions are contained.
   */
  public report(error: Error): void {
    if (this.onError !== undefined) {
      try {
        this.onError(error);
        return;
      } catch {
        // The handler itself failed, so the original failure still needs a visible home below.
      }
    }
    this.writeDefaultLine(error);
  }

  /** Writes a single-line message without a stack trace.
   * @param error Failure whose message is sent to diagnostics.
   * @returns No value; diagnostics exceptions are contained.
   */
  private writeDefaultLine(error: Error): void {
    const message = error.message.replace(LINE_BREAKS, " ");
    try {
      this.diagnostics.write(`${LINE_PREFIX} ${message}`);
    } catch {
      // Last resort: reporting to the diagnostics output must not raise another failure.
    }
  }
}
