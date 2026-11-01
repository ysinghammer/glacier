import type { IBufferingOptions } from "../../../../../application/transports/types/IBufferingOptions.js";
import type { IProcessHost } from "../../../../../application/transports/ports/outbound/IProcessHost.port.js";

/** Node host and inherited byte/time batch limits; limits default to 4096 bytes and 100 ms. */
export interface INodeStdoutTransportOptions extends IBufferingOptions {
  /**
   * Process host for stdout and exit events; omitted to locate the running Node process.
   * @default Running Node process.
   */
  readonly host?: IProcessHost;
}
