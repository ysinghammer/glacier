import type { ILogEntry } from "../../../../domain/logging/types/ILogEntry.js";
import type { ITransport } from "../../../../application/logging/ports/outbound/ITransport.port.js";
import type { ITransportDelivery } from "../../../../application/logging/ports/outbound/ITransportDelivery.port.js";
import { BufferedLineWriter } from "../../../../application/transports/BufferedLineWriter.js";
import { ExitFlushGuard } from "../../../../application/transports/ExitFlushGuard.js";
import type { INodeStdoutTransportOptions } from "./types/INodeStdoutTransportOptions.js";
import { NodeProcessLocator } from "./NodeProcessLocator.adapter.js";
import { StreamTextSink } from "./StreamTextSink.adapter.js";

// A transport can itself be logged; pending lines and process handles must stay out of its fields.
const STDOUT_WRITERS = new WeakMap<NodeStdoutTransport, BufferedLineWriter>();

/** Buffers formatted lines to stdout in order, flushing at byte/time limits and process exit; reports failed batches through delivery. */
export class NodeStdoutTransport implements ITransport {
  /**
   * Retrieves this transport's buffer without making pending lines enumerable.
   * @returns The buffer that accepts and flushes this transport's lines.
   * @throws TypeError if called with a receiver that has no retained writer.
   */
  private get writer(): BufferedLineWriter {
    const writer = STDOUT_WRITERS.get(this);
    if (writer === undefined) throw new TypeError("Invalid stdout transport receiver");
    return writer;
  }

  /**
   * Builds a buffered stdout transport, using the supplied host or the running Node process.
   * @param options Host and byte/time limits; defaults to 4096 bytes and 100 ms.
   * @default Empty options object.
   */
  constructor(options: INodeStdoutTransportOptions = {}) {
    const host = options.host ?? NodeProcessLocator.require();
    STDOUT_WRITERS.set(
      this,
      new BufferedLineWriter(new StreamTextSink(host.stdout), ExitFlushGuard.for(host), options),
    );
  }

  /**
   * Queues the delivered text and reports asynchronous write failures through the delivery.
   * @param _entry Entry supplied by the transport contract; delivery already contains its text.
   * @param delivery Formatted text source and handler for batch write failures.
   * @returns No value; adds the delivered line to the stdout buffer.
   */
  public write(_entry: ILogEntry, delivery: ITransportDelivery): void {
    this.writer.append(delivery.text(), (error) => {
      delivery.reportError(error);
    });
  }

  /**
   * Waits until all lines queued before this call have been written or reported as failed.
   * @returns Resolves when the current pending output has settled.
   */
  public flush(): Promise<void> {
    return this.writer.flush();
  }
}
