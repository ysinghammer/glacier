import { TransportFailureError } from "../logging/errors/TransportFailure.error.js";
import type { IBufferingOptions } from "./types/IBufferingOptions.js";
import type { IFlushable } from "./types/IFlushable.js";
import type { ExitFlushGuard } from "./ExitFlushGuard.js";
import type { ITextSink } from "./ports/outbound/ITextSink.port.js";

const DEFAULT_MAX_BUFFER_BYTES = 4096;
const DEFAULT_FLUSH_INTERVAL_MS = 100;

/** Accepted line and its failure reporter, retained until the writer captures a delivery batch. */
interface IPendingLine {
  /** Text of one accepted line. */
  readonly text: string;
  /**
   * Reporter associated with this line, used if its batch write fails.
   * @param error Failure for the batch containing this line.
   * @returns No value; reports the delivery failure.
   */
  readonly reportError: (error: Error) => void;
}

/** Captured batch text and the newest line's reporter, used for one serialized sink write. */
interface IBatch {
  /** Concatenated line text delivered as one sink write. */
  readonly text: string;
  /**
   * Reporter associated with the newest line in the failed batch.
   * @param error Failure for the batch.
   * @returns No value; reports the delivery failure.
   */
  readonly reportError: (error: Error) => void;
}

/**
 * Batches lines by byte threshold, timer, or flush; serializes writes and reports failure via the newest line.
 */
export class BufferedLineWriter implements IFlushable {
  /** Encoder used to measure accepted text in UTF-8 bytes. */
  private static readonly encoder = new TextEncoder();

  /** Destination receiving each concatenated batch. */
  private readonly sink: ITextSink;
  /** Process guard registered while this writer has undelivered work. */
  private readonly guard: ExitFlushGuard;
  /** Byte threshold that triggers an immediate batch write. */
  private readonly maxBufferBytes: number;
  /** Delay before a pending batch is written. */
  private readonly flushIntervalMs: number;
  /** Accepted lines not yet captured into a batch. */
  private pending: IPendingLine[] = [];
  /** UTF-8 byte count for `pending`. */
  private pendingBytes = 0;
  /** Timer scheduling a write for the first pending line. */
  private timer: ReturnType<typeof setTimeout> | undefined;
  /** Serializes batch writes and exposes their completion to flush callers. */
  private tail: Promise<void> = Promise.resolve();
  /** Flush operations queued but not yet completed. */
  private queuedFlushes = 0;
  /** Whether this writer is currently registered with the exit guard. */
  private isWatched = false;

  /** Initializes batching limits and the destination.
   * @param sink Destination that receives concatenated batches.
   * @param guard Process guard that keeps pending work observable at exit.
   * @param options Positive integer limits; omitted values use the documented defaults.
   */
  constructor(sink: ITextSink, guard: ExitFlushGuard, options: IBufferingOptions) {
    this.sink = sink;
    this.guard = guard;
    this.maxBufferBytes = BufferedLineWriter.positiveInteger(
      "maxBufferBytes",
      options.maxBufferBytes ?? DEFAULT_MAX_BUFFER_BYTES,
    );
    this.flushIntervalMs = BufferedLineWriter.positiveInteger(
      "flushIntervalMs",
      options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS,
    );
  }

  /** Accepts a line and schedules delivery without waiting for the sink.
   * @param text Line text to append; byte size is measured after UTF-8 encoding.
   * @param reportError Callback for a failed batch; it should not throw.
   * @returns No value; delivery is scheduled by threshold or timer.
   */
  public append(text: string, reportError: (error: Error) => void): void {
    const byteLength = BufferedLineWriter.encoder.encode(text).byteLength;
    this.pending.push({ text, reportError });
    this.pendingBytes += byteLength;
    if (!this.isWatched) {
      this.guard.watch(this);
      this.isWatched = true;
    }
    if (this.pendingBytes >= this.maxBufferBytes) {
      this.startFlush();
      return;
    }
    this.timer ??= setTimeout(() => {
      this.startFlush();
    }, this.flushIntervalMs);
  }

  /** Queues delivery of pending lines after earlier batches settle.
   * @returns Promise resolves after delivery; rejects if reporting or guard release throws.
   */
  public flush(): Promise<void> {
    this.clearTimer();
    this.queuedFlushes += 1;
    this.tail = this.tail.then(() => this.drain());
    return this.tail;
  }

  /** Starts a flush without waiting at the append call site.
   * @returns No value; completion remains tracked by the writer's queue.
   */
  private startFlush(): void {
    // Sink failures are routed through the line callback by deliver.
    void this.flush();
  }

  /** Delivers the next batch and releases exit watching once no work remains.
   * @returns Promise resolves after delivery and bookkeeping; rejects if either fails.
   */
  private async drain(): Promise<void> {
    const batch = this.takeBatch();
    if (batch !== undefined) {
      await this.deliver(batch);
    }
    this.queuedFlushes -= 1;
    if (this.queuedFlushes === 0 && this.pending.length === 0) {
      this.guard.release(this);
      this.isWatched = false;
    }
  }

  /** Writes one batch and reports a sink rejection to its newest line's callback.
   * @param batch Text and callback captured from pending lines.
   * @returns Promise resolves after delivery or reporting; rejects if conversion or reporting throws.
   */
  private async deliver(batch: IBatch): Promise<void> {
    try {
      await this.sink.write(batch.text);
    } catch (cause) {
      batch.reportError(TransportFailureError.from(cause));
    }
  }

  /** Captures all currently pending lines as one ordered batch.
   * @returns Batch to write, or undefined when no line is pending.
   */
  private takeBatch(): IBatch | undefined {
    const newest = this.pending.at(-1);
    if (newest === undefined) {
      return undefined;
    }
    const text = this.pending.map((line) => line.text).join("");
    this.pending = [];
    this.pendingBytes = 0;
    return { text, reportError: newest.reportError };
  }

  /** Cancels the pending timer and clears its handle.
   * @returns No value; there is no effect when no timer is active.
   */
  private clearTimer(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  /** Checks and returns a positive integer batching limit.
   * @param name Option name used in the validation error.
   * @param value Candidate limit.
   * @returns The unchanged value when it is a positive integer.
   * @throws {RangeError} When `value` is not a positive integer.
   */
  private static positiveInteger(name: string, value: number): number {
    if (!Number.isInteger(value) || value <= 0) {
      throw new RangeError(`${name} must be a positive integer, received ${String(value)}`);
    }
    return value;
  }
}
