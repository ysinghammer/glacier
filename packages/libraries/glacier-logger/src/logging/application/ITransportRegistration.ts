import type { ILogLevel } from "../domain/ILogLevel.js";
import type { ITransport } from "./ports/outbound/ITransport.port.js";

/** How a transport wants entries rendered. */
export type ILogFormat = "json" | "pretty";

/** One destination for entries together with its routing and rendering choices. */
export interface ITransportRegistration {
  readonly transport: ITransport;
  /** Minimum level for this transport, applied after the global level. Defaults to the global level. */
  readonly level?: ILogLevel;
  readonly format: ILogFormat;
  /**
   * Whether `pretty` output carries colour. The caller decides, for example from a TTY check,
   * so tests stay deterministic. Defaults to no colour.
   */
  readonly isColorEnabled?: boolean;
}
