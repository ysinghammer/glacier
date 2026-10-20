import type { ILogEntry } from "../../../../logging/domain/ILogEntry.js";
import type { ITransport } from "../../../../logging/application/ports/outbound/ITransport.port.js";
import type { ITransportDelivery } from "../../../../logging/application/ports/outbound/ITransportDelivery.port.js";
import { BufferedLineWriter } from "../../../application/BufferedLineWriter.js";
import { ExitFlushGuard } from "../../../application/ExitFlushGuard.js";
import type { INodeFileTransportOptions } from "./INodeFileTransportOptions.js";
import { FileTextSink } from "./FileTextSink.adapter.js";
import { NodeFileSystem } from "./NodeFileSystem.adapter.js";
import { NodeProcessLocator } from "./NodeProcessLocator.adapter.js";

/**
 * Appends entries to one file through a buffer, flushed at 4 KB, after 100 ms (both
 * configurable), on `beforeExit` and on `SIGINT` and `SIGTERM`. Missing parent directories are
 * created and there is no rotation: use logrotate or the platform. Each batch opens and closes
 * the file, so no handle outlives a write. Permission and disk errors are reported to the
 * factory's `onError`, and the lines of the failed batch are dropped.
 */
export class NodeFileTransport implements ITransport {
  readonly #writer: BufferedLineWriter;

  /** @throws Error for an empty path, or outside Node when no `host` is given. @throws RangeError for an invalid buffering option. */
  constructor(options: INodeFileTransportOptions) {
    if (options.path === "") {
      throw new Error("A file transport needs a non-empty path");
    }
    const host = options.host ?? NodeProcessLocator.require();
    this.#writer = new BufferedLineWriter(
      new FileTextSink(options.path, options.fileSystem ?? new NodeFileSystem()),
      ExitFlushGuard.for(host),
      options,
    );
  }

  write(_entry: ILogEntry, delivery: ITransportDelivery): void {
    this.#writer.append(delivery.text(), (error) => {
      delivery.reportError(error);
    });
  }

  /** Resolves once every line written so far has been appended to the file or reported as failed. */
  flush(): Promise<void> {
    return this.#writer.flush();
  }
}
