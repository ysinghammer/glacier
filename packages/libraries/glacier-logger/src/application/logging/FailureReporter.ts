import type { IDiagnosticsOutput } from "./ports/outbound/IDiagnosticsOutput.port.js";

const LINE_PREFIX = "[glacier-logger]";
const LINE_BREAKS = /\s*[\r\n]+\s*/g;

/**
 * Delivers failures to `onError`. It never throws and never recurses: a failing `onError` falls
 * back to one line on the diagnostics output, and a failing diagnostics output is dropped because
 * nothing is left to tell.
 */
export class FailureReporter {
  readonly #onError: ((error: Error) => void) | undefined;
  readonly #diagnostics: IDiagnosticsOutput;

  constructor(onError: ((error: Error) => void) | undefined, diagnostics: IDiagnosticsOutput) {
    this.#onError = onError;
    this.#diagnostics = diagnostics;
  }

  /** Reports `error`. The default line carries the message only, never a stack. */
  report(error: Error): void {
    if (this.#onError !== undefined) {
      try {
        this.#onError(error);
        return;
      } catch {
        // The handler itself failed, so the original failure still needs a visible home below.
      }
    }
    this.#writeDefaultLine(error);
  }

  #writeDefaultLine(error: Error): void {
    const message = error.message.replace(LINE_BREAKS, " ");
    try {
      this.#diagnostics.write(`${LINE_PREFIX} ${message}`);
    } catch {
      // Last resort: reporting to the diagnostics output must not raise another failure.
    }
  }
}
