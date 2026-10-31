import type { ILogLevel } from "../../../domain/logging/types/ILogLevel.js";
import type { ITransport } from "../ports/outbound/ITransport.port.js";

/** Selects JSON or pretty representation for a transport. */
export type ILogFormat = "json" | "pretty";

/** Configures one destination's level filtering and entry representation. */
export interface ITransportRegistration {
  /** Destination receiving entries that meet its effective minimum level. */
  readonly transport: ITransport;
  /** Additional minimum level; omitted to inherit the global level. */
  readonly level?: ILogLevel;
  /** Text or styled representation requested for this destination. */
  readonly format: ILogFormat;
  /**
   * Enables color in pretty output; caller supplies the decision, omitted for no color.
   * @default false
   */
  readonly isColorEnabled?: boolean;
}
