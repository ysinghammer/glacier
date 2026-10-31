import { JsonEntryFormatter } from "../../domain/formatting/JsonEntryFormatter.js";
import { PrettyEntryFormatter } from "../../domain/formatting/PrettyEntryFormatter.js";
import type { IStyledOutput } from "../../domain/formatting/types/IStyledOutput.js";
import type { ILogEntry } from "../../domain/logging/types/ILogEntry.js";
import type { ILogFormat, ITransportRegistration } from "./types/ITransportRegistration.js";
import type { ITransportDelivery } from "./ports/outbound/ITransportDelivery.port.js";

const LINE_END = "\n";

/** Renders one entry for one registration, on demand, so unused renderings cost nothing. */
export class TransportDelivery implements ITransportDelivery {
  public readonly format: ILogFormat;
  private readonly entry: ILogEntry;
  private readonly pretty: PrettyEntryFormatter;
  private readonly reportErrorValue: (error: Error) => void;

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

  public text(): string {
    if (this.format === "json") {
      return new JsonEntryFormatter().format(this.entry);
    }
    return `${this.pretty.format(this.entry)}${LINE_END}`;
  }

  public styled(): IStyledOutput {
    return this.pretty.formatStyled(this.entry);
  }

  public reportError(error: Error): void {
    this.reportErrorValue(error);
  }
}
