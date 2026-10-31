import type { IDiagnosticsOutput } from "../../../../application/logging/ports/outbound/IDiagnosticsOutput.port.js";

interface ILineStream {
  write(chunk: string): unknown;
}

/** Writes to `process.stderr` when running on Node and to `console.error` everywhere else. */
export class EnvironmentDiagnostics implements IDiagnosticsOutput {
  public write(line: string): void {
    const stderr = EnvironmentDiagnostics.findStderr();
    if (!EnvironmentDiagnostics.isLineStream(stderr)) {
      console.error(line);
      return;
    }
    stderr.write(`${line}\n`);
  }

  private static findStderr(): unknown {
    const host: unknown = Reflect.get(globalThis, "process");
    if (!(host instanceof Object)) {
      return undefined;
    }
    return Reflect.get(host, "stderr");
  }

  private static isLineStream(value: unknown): value is ILineStream {
    return value instanceof Object && typeof Reflect.get(value, "write") === "function";
  }
}
