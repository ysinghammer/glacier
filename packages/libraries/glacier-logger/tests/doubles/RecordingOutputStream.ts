import type { IOutputStream } from "../../index.js";

/** Test-owned output stream. It records writes, can hold their callbacks to simulate backpressure, and can fail. */
export class RecordingOutputStream implements IOutputStream {
  readonly chunks: string[] = [];
  failure: Error | undefined;
  isHolding = false;
  readonly #held: (() => void)[] = [];

  write(chunk: string, callback: (error?: Error | null) => void): boolean {
    this.chunks.push(chunk);
    const complete = (): void => {
      callback(this.failure);
    };
    if (this.isHolding) {
      this.#held.push(complete);
    } else {
      complete();
    }
    return !this.isHolding;
  }

  /** Completes every held write, oldest first. */
  releaseHeld(): void {
    this.isHolding = false;
    for (const complete of this.#held.splice(0)) {
      complete();
    }
  }
}
