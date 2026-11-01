import { JsonEntryFormatter } from "../../domain/formatting/JsonEntryFormatter.js";
import { PrettyEntryFormatter } from "../../domain/formatting/PrettyEntryFormatter.js";
import type { IStyledOutput } from "../../domain/formatting/types/IStyledOutput.js";
import type { ILogEntry } from "../../domain/logging/types/ILogEntry.js";
import type { ILogFormat, ITransportRegistration } from "./types/ITransportRegistration.js";
import type { ITransportDelivery } from "./ports/outbound/ITransportDelivery.port.js";

const LINE_END = "\n";

/** Supplies a registration-specific, lazily rendered view of one log entry. */
export class TransportDelivery implements ITransportDelivery {
  /** Format requested by the transport registration. */
  public readonly format: ILogFormat;
  /** Entry rendered or styled when requested by the destination. */
  private readonly entry: ILogEntry;
  /** Formatter configured with this registration's color choice. */
  private readonly pretty: PrettyEntryFormatter;
  /**
   * Reporter receiving failures reported by asynchronous destinations.
   * @param error Failure raised by the destination.
   * @returns No value; forwards the failure to configured reporting.
   */
  private readonly reportErrorValue: (error: Error) => void;

  /** Captures an entry and its destination-specific formatting and reporting settings.
   * @param entry Redacted log entry to expose to the destination.
   * @param registration Format and color options for this destination.
   * @param reportError Handler for failures that occur after synchronous delivery.
   */
  constructor(
    entry: ILogEntry,
    registration: ITransportRegistration,
    reportError: (error: Error) => void,
  ) {
    this.format = registration.format;
    this.entry = entry;
    this.pretty = new PrettyEntryFormatter({
      isColorEnabled: registration.isColorEnabled ?? false,
    });
    this.reportErrorValue = reportError;
  }

  /** Renders the entry in the registered format as one newline-terminated line.
   * @returns JSON text or pretty text ending with a newline.
   */
  public text(): string {
    if (this.format === "json") {
      return new JsonEntryFormatter().format(this.entry);
    }
    return `${this.pretty.format(this.entry)}${LINE_END}`;
  }

  /** Renders the entry as a pretty console format string with style values.
   * @returns Styled pretty representation using the registration's color setting.
   */
  public styled(): IStyledOutput {
    return this.pretty.formatStyled(this.entry);
  }

  /** Forwards a later delivery failure to the configured reporter.
   * @param error Failure raised by the destination.
   * @returns No value; reporting behavior is owned by the configured handler.
   */
  public reportError(error: Error): void {
    this.reportErrorValue(error);
  }
}
