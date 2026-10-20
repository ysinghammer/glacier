import { FilePaths } from "../../../application/FilePaths.js";
import type { IFileSystem } from "../../../application/ports/outbound/IFileSystem.port.js";
import type { ITextSink } from "../../../application/ports/outbound/ITextSink.port.js";

/** Appends batches to one file, creating its parent directories first. Nothing stays open between batches. */
export class FileTextSink implements ITextSink {
  readonly #path: string;
  readonly #fileSystem: IFileSystem;

  constructor(path: string, fileSystem: IFileSystem) {
    this.#path = path;
    this.#fileSystem = fileSystem;
  }

  async write(text: string): Promise<void> {
    const directory = FilePaths.parentDirectory(this.#path);
    if (directory !== undefined) {
      await this.#fileSystem.ensureDirectory(directory);
    }
    await this.#fileSystem.appendText(this.#path, text);
  }
}
