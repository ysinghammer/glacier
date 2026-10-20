import type { ILogEntry } from "../../../../logging/domain/ILogEntry.js";
import type { ITransport } from "../../../../logging/application/ports/outbound/ITransport.port.js";
import type { ITransportDelivery } from "../../../../logging/application/ports/outbound/ITransportDelivery.port.js";
import { BufferedLineWriter } from "../../../application/BufferedLineWriter.js";
import { ExitFlushGuard } from "../../../application/ExitFlushGuard.js";
import type { INodeStdoutTransportOptions } from "./INodeStdoutTransportOptions.js";
import { NodeProcessLocator } from "./NodeProcessLocator.adapter.js";
import { StreamTextSink } from "./StreamTextSink.adapter.js";

/**
 * Writes entries to `process.stdout` through a buffer. Lines are collected and written when 4 KB
 * are pending or 100 ms have passed (both configurable), in order, one batch at a time. Pending
 * lines are also flushed on `beforeExit`, `SIGINT` and `SIGTERM`. A failed write is reported to
 * the factory's `onError`.
 */
export class NodeStdoutTransport implements ITransport {
  readonly #writer: BufferedLineWriter;

  /** @throws Error outside Node when no `host` is given. @throws RangeError for an invalid buffering option. */
  constructor(options: INodeStdoutTransportOptions = {}) {
    const host = options.host ?? NodeProcessLocator.require();
    this.#writer = new BufferedLineWriter(
      new StreamTextSink(host.stdout),
      ExitFlushGuard.for(host),
      options,
    );
  }

  write(_entry: ILogEntry, delivery: ITransportDelivery): void {
    this.#writer.append(delivery.text(), (error) => {
      delivery.reportError(error);
    });
  }

  /** Resolves once every line written so far has reached `stdout`. */
  flush(): Promise<void> {
    return this.#writer.flush();
  }
}
