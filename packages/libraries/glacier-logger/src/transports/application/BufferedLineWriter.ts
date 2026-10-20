import { TransportFailureError } from "../../logging/application/TransportFailure.error.js";
import type { IBufferingOptions } from "./IBufferingOptions.js";
import type { IFlushable } from "./IFlushable.js";
import type { ExitFlushGuard } from "./ExitFlushGuard.js";
import type { ITextSink } from "./ports/outbound/ITextSink.port.js";

const DEFAULT_MAX_BUFFER_BYTES = 4096;
const DEFAULT_FLUSH_INTERVAL_MS = 100;

interface IPendingLine {
  readonly text: string;
  readonly reportError: (error: Error) => void;
}

interface IBatch {
  readonly text: string;
  readonly reportError: (error: Error) => void;
}

/**
 * Collects lines and writes them to a sink in batches: when the buffer reaches `maxBufferBytes`,
 * or `flushIntervalMs` after the first pending line, or on `flush()`. Batches are written one at
 * a time in the order lines arrived, and the next one starts only after the sink settled the
 * previous one, which is the backpressure. A sink failure is reported through the `reportError`
 * of the newest line in the failed batch; those lines are dropped.
 */
export class BufferedLineWriter implements IFlushable {
  static readonly #encoder = new TextEncoder();

  readonly #sink: ITextSink;
  readonly #guard: ExitFlushGuard;
  readonly #maxBufferBytes: number;
  readonly #flushIntervalMs: number;
  #pending: IPendingLine[] = [];
  #pendingBytes = 0;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #tail: Promise<void> = Promise.resolve();
  #queuedFlushes = 0;
  #isWatched = false;

  /** @throws RangeError when an option is not a positive integer. */
  constructor(sink: ITextSink, guard: ExitFlushGuard, options: IBufferingOptions) {
    this.#sink = sink;
    this.#guard = guard;
    this.#maxBufferBytes = BufferedLineWriter.#positiveInteger(
      "maxBufferBytes",
      options.maxBufferBytes ?? DEFAULT_MAX_BUFFER_BYTES,
    );
    this.#flushIntervalMs = BufferedLineWriter.#positiveInteger(
      "flushIntervalMs",
      options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS,
    );
  }

  /** Accepts one line. It never throws and never waits for the sink. */
  append(text: string, reportError: (error: Error) => void): void {
    const byteLength = BufferedLineWriter.#encoder.encode(text).byteLength;
    this.#pending.push({ text, reportError });
    this.#pendingBytes += byteLength;
    if (!this.#isWatched) {
      this.#guard.watch(this);
      this.#isWatched = true;
    }
    if (this.#pendingBytes >= this.#maxBufferBytes) {
      this.#startFlush();
      return;
    }
    this.#timer ??= setTimeout(() => {
      this.#startFlush();
    }, this.#flushIntervalMs);
  }

  /** Resolves once every line accepted so far has been written or reported as failed. Never rejects. */
  flush(): Promise<void> {
    this.#clearTimer();
    this.#queuedFlushes += 1;
    this.#tail = this.#tail.then(() => this.#drain());
    return this.#tail;
  }

  #startFlush(): void {
    // flush never rejects: failures go to the lines' reportError.
    void this.flush();
  }

  async #drain(): Promise<void> {
    const batch = this.#takeBatch();
    if (batch !== undefined) {
      await this.#deliver(batch);
    }
    this.#queuedFlushes -= 1;
    if (this.#queuedFlushes === 0 && this.#pending.length === 0) {
      this.#guard.release(this);
      this.#isWatched = false;
    }
  }

  async #deliver(batch: IBatch): Promise<void> {
    try {
      await this.#sink.write(batch.text);
    } catch (cause) {
      batch.reportError(TransportFailureError.from(cause));
    }
  }

  #takeBatch(): IBatch | undefined {
    const newest = this.#pending.at(-1);
    if (newest === undefined) {
      return undefined;
    }
    const text = this.#pending.map((line) => line.text).join("");
    this.#pending = [];
    this.#pendingBytes = 0;
    return { text, reportError: newest.reportError };
  }

  #clearTimer(): void {
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  static #positiveInteger(name: string, value: number): number {
    if (!Number.isInteger(value) || value <= 0) {
      throw new RangeError(`${name} must be a positive integer, received ${String(value)}`);
    }
    return value;
  }
}
