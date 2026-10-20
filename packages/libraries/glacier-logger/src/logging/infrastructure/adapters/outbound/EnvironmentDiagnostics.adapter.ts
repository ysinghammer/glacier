import type { IDiagnosticsOutput } from "../../../application/ports/outbound/IDiagnosticsOutput.port.js";

interface ILineStream {
  write(chunk: string): unknown;
}

/** Writes to `process.stderr` when running on Node and to `console.error` everywhere else. */
export class EnvironmentDiagnostics implements IDiagnosticsOutput {
  write(line: string): void {
    const stderr = EnvironmentDiagnostics.#findStderr();
    if (!EnvironmentDiagnostics.#isLineStream(stderr)) {
      console.error(line);
      return;
    }
    stderr.write(`${line}\n`);
  }

  static #findStderr(): unknown {
    const host: unknown = Reflect.get(globalThis, "process");
    if (!(host instanceof Object)) {
      return undefined;
    }
    return Reflect.get(host, "stderr");
  }

  static #isLineStream(value: unknown): value is ILineStream {
    return value instanceof Object && typeof Reflect.get(value, "write") === "function";
  }
}
