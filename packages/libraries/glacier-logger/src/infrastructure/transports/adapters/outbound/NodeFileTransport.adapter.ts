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

/** Appends ordered batches to one file without rotation; flushes on byte/time limits and process exit, reporting and dropping failed batches. */
export class NodeFileTransport implements ITransport {
  /**
   * Retrieves this transport's private buffer without exposing filesystem state.
   * @returns The buffer that accepts and flushes this transport's lines.
   * @throws TypeError if called with a receiver that has no retained writer.
   */
  private get writer(): BufferedLineWriter {
    const writer = FILE_WRITERS.get(this);
    if (writer === undefined) throw new TypeError("Invalid file transport receiver");
    return writer;
  }

  /**
   * Creates a buffered file transport with the configured destination and dependencies.
   * @param options Required path and optional dependencies; limits default to 4096 bytes/100 ms.
   * @throws Error when the configured destination path is empty.
   */
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

  /**
   * Queues the delivered text and reports asynchronous write failures through the delivery.
   * @param _entry Entry supplied by the transport contract; delivery already contains its text.
   * @param delivery Formatted text source and handler for batch write failures.
   * @returns No value; adds the delivered line to the file buffer.
   */
  public write(_entry: ILogEntry, delivery: ITransportDelivery): void {
    this.writer.append(delivery.text(), (error) => {
      delivery.reportError(error);
    });
  }

  /**
   * Waits until queued lines have been appended or their failures have been reported.
   * @returns Resolves when the current pending output has settled.
   */
  public flush(): Promise<void> {
    return this.writer.flush();
  }
}
