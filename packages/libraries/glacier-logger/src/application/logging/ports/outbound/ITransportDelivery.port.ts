import type { IStyledOutput } from "../../../../domain/formatting/types/IStyledOutput.js";
import type { ILogFormat } from "../../types/ITransportRegistration.js";

/** Provides registered rendering and reporting operations alongside a transport entry. */
export interface ITransportDelivery {
  /** Format requested by the destination registration. */
  readonly format: ILogFormat;
  /**
   * Renders the entry as one newline-terminated text line.
   * @returns JSON or pretty representation selected by `format`.
   */
  text(): string;
  /**
   * Renders a pretty console format string and its style values.
   * @returns Styled representation, using registration color settings.
   */
  styled(): IStyledOutput;
  /** Forwards a failure that occurred during or after destination delivery.
   * @param error Failure to report.
   * @returns No value; the configured failure reporter handles it.
   */
  reportError(error: Error): void;
}
