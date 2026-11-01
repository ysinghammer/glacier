import type { IBufferingOptions } from "../../../../../application/transports/types/IBufferingOptions.js";
import type { IFileSystem } from "../../../../../application/transports/ports/outbound/IFileSystem.port.js";
import type { IProcessHost } from "../../../../../application/transports/ports/outbound/IProcessHost.port.js";

/** File destination and dependencies; inherited byte/time limits default to 4096 bytes and 100 ms. */
export interface INodeFileTransportOptions extends IBufferingOptions {
  /** Non-empty destination path; the file and missing parent directories are created on write. */
  readonly path: string;
  /**
   * Filesystem implementation; omitted to use Node's real filesystem.
   * @default NodeFileSystem.
   */
  readonly fileSystem?: IFileSystem;
  /**
   * Process host whose exit events trigger flushing; omitted to locate the running Node process.
   * @default Running Node process.
   */
  readonly host?: IProcessHost;
}
