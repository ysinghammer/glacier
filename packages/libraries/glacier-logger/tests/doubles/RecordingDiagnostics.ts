import type { IDiagnosticsOutput } from "../../index.js";

/** Test-owned diagnostics output that records lines, or fails when told to. */
export class RecordingDiagnostics implements IDiagnosticsOutput {
  readonly lines: string[] = [];
  readonly #isFailing: boolean;

  constructor(isFailing = false) {
    this.#isFailing = isFailing;
  }

  write(line: string): void {
    if (this.#isFailing) {
      throw new Error("diagnostics unavailable");
    }
    this.lines.push(line);
  }
}
