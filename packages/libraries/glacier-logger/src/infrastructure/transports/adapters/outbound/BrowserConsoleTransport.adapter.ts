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

/** Writes trace/debug to debug, info to info, warn to warn, and error/fatal to error; JSON passes entries, pretty passes its format and styles. */
export class BrowserConsoleTransport implements ITransport {
  /**
   * Retrieves the injected console without exposing it through enumerable transport state.
   * @returns The console output retained for this transport instance.
   * @throws TypeError if called with a receiver that has no retained console.
   */
  private get console(): IConsoleOutput {
    const output = CONSOLE_OUTPUTS.get(this);
    if (output === undefined) throw new TypeError("Invalid console transport receiver");
    return output;
  }

  /**
   * Retains the injected console or uses the global console by default.
   * @param options Console selection; defaults to an empty object using global `console`.
   * @default Empty options object.
   */
  constructor(options: IBrowserConsoleTransportOptions = {}) {
    CONSOLE_OUTPUTS.set(this, options.console ?? console);
  }

  /**
   * Sends the entry immediately, selecting the console method by level and requested format.
   * @param entry Log entry whose level selects the console method.
   * @param delivery Supplies the selected text format and its styled representation.
   * @returns No value; writes the entry or formatted output to the console.
   */
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
