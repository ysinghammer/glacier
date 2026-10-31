import type { IDiagnosticsOutput } from "../../index.js";

/** Captures diagnostics output for assertions and can simulate an unavailable sink. */
export class RecordingDiagnostics implements IDiagnosticsOutput {
  /**
   * Readonly array reference of lines accepted by the sink, in write order.
   * @default An empty array
   */
  public readonly lines: string[] = [];
  /**
   * Whether writes fail before being recorded; initialized from the constructor option.
   * @default The constructor's `isFailing` argument, which defaults to `false`
   */
  private readonly isFailing: boolean;

  /**
   * Creates a diagnostics sink with optional deterministic write failure.
   * @param isFailing Whether each write directly throws; defaults to `false`.
   */
  constructor(isFailing = false) {
    this.isFailing = isFailing;
  }

  /**
   * Records a line unless failure simulation is enabled.
   * @param line Complete diagnostics text supplied by the logger.
   * @returns No value; a successful write appends {@link line} to {@link lines}.
   * @throws {Error} When this instance was created with `isFailing` set to `true`.
   */
  public write(line: string): void {
    if (this.isFailing) {
      throw new Error("diagnostics unavailable");
    }
    this.lines.push(line);
  }
}
