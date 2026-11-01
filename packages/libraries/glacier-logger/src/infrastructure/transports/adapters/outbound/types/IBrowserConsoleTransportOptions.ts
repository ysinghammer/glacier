import type { IConsoleOutput } from "../../../../../application/transports/ports/outbound/IConsoleOutput.port.js";

/** Configuration for choosing the console output used by a browser console transport. */
export interface IBrowserConsoleTransportOptions {
  /**
   * Console receiving entries; omitted to use the global `console`.
   * @default Global `console`.
   */
  readonly console?: IConsoleOutput;
}
