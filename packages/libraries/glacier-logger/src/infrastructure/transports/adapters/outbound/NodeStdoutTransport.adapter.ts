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

/**
 * Writes entries to `process.stdout` through a buffer. Lines are collected and written when 4 KB
 * are pending or 100 ms have passed (both configurable), in order, one batch at a time. Pending
 * lines are also flushed on `beforeExit`, `SIGINT` and `SIGTERM`. A failed write is reported to
 * the factory's `onError`.
 */
export class NodeStdoutTransport implements ITransport {
  /** Resolves the transport buffer without making pending lines enumerable. */
  private get writer(): BufferedLineWriter {
    const writer = STDOUT_WRITERS.get(this);
    if (writer === undefined) throw new TypeError("Invalid stdout transport receiver");
    return writer;
  }

  /** @throws Error outside Node when no `host` is given. @throws RangeError for an invalid buffering option. */
  constructor(options: INodeStdoutTransportOptions = {}) {
    const host = options.host ?? NodeProcessLocator.require();
    STDOUT_WRITERS.set(
      this,
      new BufferedLineWriter(new StreamTextSink(host.stdout), ExitFlushGuard.for(host), options),
    );
  }

  public write(_entry: ILogEntry, delivery: ITransportDelivery): void {
    this.writer.append(delivery.text(), (error) => {
      delivery.reportError(error);
    });
  }

  /** Resolves once every line written so far has reached `stdout`. */
  public flush(): Promise<void> {
    return this.writer.flush();
  }
}
