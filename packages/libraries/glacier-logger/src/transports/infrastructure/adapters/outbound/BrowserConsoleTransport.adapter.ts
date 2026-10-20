import type { ITransport } from "../../../../logging/application/ports/outbound/ITransport.port.js";
import type { ITransportDelivery } from "../../../../logging/application/ports/outbound/ITransportDelivery.port.js";
import type { ILogEntry } from "../../../../logging/domain/ILogEntry.js";
import type { ILogLevel } from "../../../../logging/domain/ILogLevel.js";
import type { IConsoleOutput } from "../../../application/ports/outbound/IConsoleOutput.port.js";
import type { IBrowserConsoleTransportOptions } from "./IBrowserConsoleTransportOptions.js";

const CONSOLE_METHOD_BY_LEVEL: Readonly<Record<ILogLevel, keyof IConsoleOutput>> = {
  trace: "debug",
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
  fatal: "error",
};

/**
 * Writes each entry straight to the console, unbuffered: `trace` and `debug` use `console.debug`,
 * `info` uses `console.info`, `warn` uses `console.warn`, and `error` and `fatal` use
 * `console.error`. With the `json` format the console receives the structured entry object, so
 * its inspector can expand it; there is no JSON-string mode. With `pretty` it receives the styled
 * format string and its `%c` styles.
 */
export class BrowserConsoleTransport implements ITransport {
  readonly #console: IConsoleOutput;

  constructor(options: IBrowserConsoleTransportOptions = {}) {
    this.#console = options.console ?? console;
  }

  write(entry: ILogEntry, delivery: ITransportDelivery): void {
    const method = CONSOLE_METHOD_BY_LEVEL[entry.level];
    if (delivery.format === "json") {
      this.#console[method](entry);
      return;
    }
    const styled = delivery.styled();
    this.#console[method](styled.format, ...styled.styles);
  }
}
