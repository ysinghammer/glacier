import type { ILogEntry } from "../../../../domain/logging/types/ILogEntry.js";
import type { ITransport } from "../../../../application/logging/ports/outbound/ITransport.port.js";
import type { ITransportDelivery } from "../../../../application/logging/ports/outbound/ITransportDelivery.port.js";
import { BufferedLineWriter } from "../../../../application/transports/BufferedLineWriter.js";
import { ExitFlushGuard } from "../../../../application/transports/ExitFlushGuard.js";
import type { INodeFileTransportOptions } from "./types/INodeFileTransportOptions.js";
import { FileTextSink } from "./FileTextSink.adapter.js";
import { NodeFileSystem } from "./NodeFileSystem.adapter.js";
import { NodeProcessLocator } from "./NodeProcessLocator.adapter.js";

// Pending log lines and filesystem state must not be exposed by transport serialization.
const FILE_WRITERS = new WeakMap<NodeFileTransport, BufferedLineWriter>();

/**
 * Appends entries to one file through a buffer, flushed at 4 KB, after 100 ms (both
 * configurable), on `beforeExit` and on `SIGINT` and `SIGTERM`. Missing parent directories are
 * created and there is no rotation: use logrotate or the platform. Each batch opens and closes
 * the file, so no handle outlives a write. Permission and disk errors are reported to the
 * factory's `onError`, and the lines of the failed batch are dropped.
 */
export class NodeFileTransport implements ITransport {
  /** Resolves this transport's private buffer while retaining receiver validation. */
  private get writer(): BufferedLineWriter {
    const writer = FILE_WRITERS.get(this);
    if (writer === undefined) throw new TypeError("Invalid file transport receiver");
    return writer;
  }

  /** @throws Error for an empty path, or outside Node when no `host` is given. @throws RangeError for an invalid buffering option. */
  constructor(options: INodeFileTransportOptions) {
    if (options.path === "") {
      throw new Error("A file transport needs a non-empty path");
    }
    const host = options.host ?? NodeProcessLocator.require();
    FILE_WRITERS.set(
      this,
      new BufferedLineWriter(
        new FileTextSink(options.path, options.fileSystem ?? new NodeFileSystem()),
        ExitFlushGuard.for(host),
        options,
      ),
    );
  }

  public write(_entry: ILogEntry, delivery: ITransportDelivery): void {
    this.writer.append(delivery.text(), (error) => {
      delivery.reportError(error);
    });
  }

  /** Resolves once every line written so far has been appended to the file or reported as failed. */
  public flush(): Promise<void> {
    return this.writer.flush();
  }
}
