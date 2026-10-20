import type { IStyledOutput } from "../../../../formatting/domain/IStyledOutput.js";
import type { ILogFormat } from "../../ITransportRegistration.js";

/**
 * What a transport gets next to an entry: the entry rendered the way its registration asked for,
 * and the way to report failures that only surface later, such as a rejected asynchronous write.
 */
export interface ITransportDelivery {
  /** The registered format. A console-style transport passes the structured entry for `json`. */
  readonly format: ILogFormat;
  /** The entry as one line of text ending in `\n`, formatted as `format` says. */
  text(): string;
  /** The pretty layout as console format string and styles, coloured when the registration enables it. */
  styled(): IStyledOutput;
  /** Hands a failure to the configured `onError`. It never throws. */
  reportError(error: Error): void;
}
