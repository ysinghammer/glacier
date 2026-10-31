import type { IDiagnosticsOutput } from "../../../../application/logging/ports/outbound/IDiagnosticsOutput.port.js";

/** Minimal writable interface used to detect a Node-like stderr without requiring Node types. */
interface ILineStream {
  /**
   * Writes one diagnostic chunk to the detected stderr-like stream.
   * @param chunk Text chunk to write, including any desired line ending.
   * @returns The stream's write result; this adapter does not inspect it.
   */
  write(chunk: string): unknown;
}

/** Sends diagnostic lines to Node stderr when available, otherwise to the host console. */
export class EnvironmentDiagnostics implements IDiagnosticsOutput {
  /**
   * Writes a line with a newline on Node stderr or as one console error elsewhere.
   * @param line Diagnostic text to write, without an added newline requirement.
   * @returns No value; emits the diagnostic through the detected host output.
   */
  public write(line: string): void {
    const stderr = EnvironmentDiagnostics.findStderr();
    if (!EnvironmentDiagnostics.isLineStream(stderr)) {
      console.error(line);
      return;
    }
    stderr.write(`${line}\n`);
  }

  /**
   * Reads the global process candidate's stderr without assuming that Node is present.
   * @returns The stderr candidate, or `undefined` when no usable stderr is present.
   */
  private static findStderr(): unknown {
    const host: unknown = Reflect.get(globalThis, "process");
    if (!(host instanceof Object)) {
      return undefined;
    }
    return Reflect.get(host, "stderr");
  }

  /**
   * Checks whether a value has a callable write member suitable for line output.
   * @param value Unknown candidate to inspect without assuming a host runtime.
   * @returns Whether the candidate can be treated as an stderr-like line stream.
   */
  private static isLineStream(value: unknown): value is ILineStream {
    return value instanceof Object && typeof Reflect.get(value, "write") === "function";
  }
}
