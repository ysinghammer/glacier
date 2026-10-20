import { JsonEntryFormatter } from "../../formatting/domain/JsonEntryFormatter.js";
import { PrettyEntryFormatter } from "../../formatting/domain/PrettyEntryFormatter.js";
import type { IStyledOutput } from "../../formatting/domain/IStyledOutput.js";
import type { ILogEntry } from "../domain/ILogEntry.js";
import type { ILogFormat, ITransportRegistration } from "./ITransportRegistration.js";
import type { ITransportDelivery } from "./ports/outbound/ITransportDelivery.port.js";

const LINE_END = "\n";

/** Renders one entry for one registration, on demand, so unused renderings cost nothing. */
export class TransportDelivery implements ITransportDelivery {
  readonly format: ILogFormat;
  readonly #entry: ILogEntry;
  readonly #pretty: PrettyEntryFormatter;
  readonly #reportError: (error: Error) => void;

  constructor(
    entry: ILogEntry,
    registration: ITransportRegistration,
    reportError: (error: Error) => void,
  ) {
    this.format = registration.format;
    this.#entry = entry;
    this.#pretty = new PrettyEntryFormatter({
      isColorEnabled: registration.isColorEnabled ?? false,
    });
    this.#reportError = reportError;
  }

  text(): string {
    if (this.format === "json") {
      return new JsonEntryFormatter().format(this.#entry);
    }
    return `${this.#pretty.format(this.#entry)}${LINE_END}`;
  }

  styled(): IStyledOutput {
    return this.#pretty.formatStyled(this.#entry);
  }

  reportError(error: Error): void {
    this.#reportError(error);
  }
}
