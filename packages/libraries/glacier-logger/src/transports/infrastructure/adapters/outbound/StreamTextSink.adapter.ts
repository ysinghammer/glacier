import type { IOutputStream } from "../../../application/IOutputStream.js";
import type { ITextSink } from "../../../application/ports/outbound/ITextSink.port.js";

/** Writes batches to an output stream and settles when the stream confirms each one, so the writer honours backpressure. */
export class StreamTextSink implements ITextSink {
  readonly #stream: IOutputStream;

  constructor(stream: IOutputStream) {
    this.#stream = stream;
  }

  write(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#stream.write(text, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}
