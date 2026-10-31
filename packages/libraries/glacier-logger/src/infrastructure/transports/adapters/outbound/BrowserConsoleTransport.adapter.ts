import type { ITransport } from "../../../../application/logging/ports/outbound/ITransport.port.js";
import type { ITransportDelivery } from "../../../../application/logging/ports/outbound/ITransportDelivery.port.js";
import type { ILogEntry } from "../../../../domain/logging/types/ILogEntry.js";
import type { ILogLevel } from "../../../../domain/logging/types/ILogLevel.js";
import type { IConsoleOutput } from "../../../../application/transports/ports/outbound/IConsoleOutput.port.js";
import type { IBrowserConsoleTransportOptions } from "./types/IBrowserConsoleTransportOptions.js";

const CONSOLE_METHOD_BY_LEVEL: Readonly<Record<ILogLevel, keyof IConsoleOutput>> = {
  trace: "debug",
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
  fatal: "error",
};

// Injected consoles can retain prior log entries; serialization must not traverse their state.
const CONSOLE_OUTPUTS = new WeakMap<BrowserConsoleTransport, IConsoleOutput>();

/**
 * Writes each entry straight to the console, unbuffered: `trace` and `debug` use `console.debug`,
 * `info` uses `console.info`, `warn` uses `console.warn`, and `error` and `fatal` use
 * `console.error`. With the `json` format the console receives the structured entry object, so
 * its inspector can expand it; there is no JSON-string mode. With `pretty` it receives the styled
 * format string and its `%c` styles.
 */
export class BrowserConsoleTransport implements ITransport {
  /** Preserves opaque transport output and rejects invalid borrowed receivers. */
  private get console(): IConsoleOutput {
    const output = CONSOLE_OUTPUTS.get(this);
    if (output === undefined) throw new TypeError("Invalid console transport receiver");
    return output;
  }

  constructor(options: IBrowserConsoleTransportOptions = {}) {
    CONSOLE_OUTPUTS.set(this, options.console ?? console);
  }

  public write(entry: ILogEntry, delivery: ITransportDelivery): void {
    const method = CONSOLE_METHOD_BY_LEVEL[entry.level];
    if (delivery.format === "json") {
      this.console[method](entry);
      return;
    }
    const styled = delivery.styled();
    this.console[method](styled.format, ...styled.styles);
  }
}
