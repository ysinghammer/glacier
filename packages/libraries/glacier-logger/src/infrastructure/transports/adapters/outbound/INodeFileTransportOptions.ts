import type { IBufferingOptions } from "../../../../application/transports/IBufferingOptions.js";
import type { IFileSystem } from "../../../../application/transports/ports/outbound/IFileSystem.port.js";
import type { IProcessHost } from "../../../../application/transports/ports/outbound/IProcessHost.port.js";

/** Options of `NodeFileTransport`. */
export interface INodeFileTransportOptions extends IBufferingOptions {
  /** File to append to. It and its parent directories are created when missing. */
  readonly path: string;
  /** File operations. Defaults to the real file system. */
  readonly fileSystem?: IFileSystem;
  /** The process whose exit is watched. Defaults to the running Node process. */
  readonly host?: IProcessHost;
}
