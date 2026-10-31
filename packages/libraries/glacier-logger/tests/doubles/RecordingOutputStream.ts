import type { IOutputStream } from "../../index.js";

/** Records stream writes and simulates callback completion, backpressure, and write failures. */
export class RecordingOutputStream implements IOutputStream {
  /**
   * Readonly array reference of chunks submitted to the stream, in write order.
   * @default An empty array
   */
  public readonly chunks: string[] = [];
  /**
   * Mutable error supplied to write callbacks; `undefined` represents success.
   * @default `undefined`
   */
  public failure: Error | undefined;
  /**
   * Mutable flag; when true, callbacks wait until {@link releaseHeld} is called.
   * @default `false`
   */
  public isHolding = false;
  /**
   * Readonly array reference of callbacks retained while writes are held, in order.
   * @default An empty array
   */
  private readonly held: (() => void)[] = [];

  /**
   * Records a chunk and completes now or holds its callback for backpressure simulation.
   * @param chunk Text submitted by the transport.
   * @param callback Completion callback; receives the configured failure or `undefined` on success.
   * @returns Whether the write was accepted without simulated backpressure.
   */
  public write(chunk: string, callback: (error?: Error | null) => void): boolean {
    this.chunks.push(chunk);
    const complete = (): void => {
      callback(this.failure);
    };
    if (this.isHolding) {
      this.held.push(complete);
    } else {
      complete();
    }
    return !this.isHolding;
  }

  /**
   * Resumes writes and completes all currently held callbacks in submission order.
   * @returns No value; pending callbacks receive the current {@link failure}.
   */
  public releaseHeld(): void {
    this.isHolding = false;
    for (const complete of this.held.splice(0)) {
      complete();
    }
  }
}
