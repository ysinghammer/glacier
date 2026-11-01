import type { IOutputStream } from "../../../../application/transports/types/IOutputStream.js";
import type { ITextSink } from "../../../../application/transports/ports/outbound/ITextSink.port.js";

/** Adapts callback-based stream writes to promises so callers can wait for stream completion. */
export class StreamTextSink implements ITextSink {
  /** Output stream receiving each text batch. */
  private readonly stream: IOutputStream;

  /**
   * Binds the output stream whose write callbacks determine batch completion.
   * @param stream Stream that accepts text and calls back when each write settles.
   */
  constructor(stream: IOutputStream) {
    this.stream = stream;
  }

  /**
   * Writes one batch and settles only when the stream invokes its completion callback.
   * @param text Batch passed unchanged to the output stream.
   * @returns Resolves when the callback succeeds; rejects with its error when it fails.
   */
  public write(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.write(text, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}
