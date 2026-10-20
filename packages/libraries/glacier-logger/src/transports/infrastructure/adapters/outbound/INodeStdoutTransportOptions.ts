import type { IBufferingOptions } from "../../../application/IBufferingOptions.js";
import type { IProcessHost } from "../../../application/ports/outbound/IProcessHost.port.js";

/** Options of `NodeStdoutTransport`. */
export interface INodeStdoutTransportOptions extends IBufferingOptions {
  /** The process whose `stdout` is written and whose exit is watched. Defaults to the running Node process. */
  readonly host?: IProcessHost;
}
