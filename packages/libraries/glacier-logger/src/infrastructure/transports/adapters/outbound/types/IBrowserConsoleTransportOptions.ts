import type { IConsoleOutput } from "../../../../../application/transports/ports/outbound/IConsoleOutput.port.js";

/** Options of `BrowserConsoleTransport`. */
export interface IBrowserConsoleTransportOptions {
  /** Console to write to. Defaults to the global `console`. */
  readonly console?: IConsoleOutput;
}
