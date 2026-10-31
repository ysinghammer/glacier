import { FilePaths } from "../../../../application/transports/FilePaths.js";
import type { IFileSystem } from "../../../../application/transports/ports/outbound/IFileSystem.port.js";
import type { ITextSink } from "../../../../application/transports/ports/outbound/ITextSink.port.js";

/** Appends each supplied batch to one file after ensuring its parent directory exists. */
export class FileTextSink implements ITextSink {
  /** Destination file path used for every batch; retained unchanged for this sink's lifetime. */
  private readonly path: string;
  /** Filesystem implementation used to create parent directories and append each batch. */
  private readonly fileSystem: IFileSystem;

  /**
   * Binds one file destination to the filesystem implementation used for writes.
   * @param path Destination file path; an absent parent directory is created on write.
   * @param fileSystem Filesystem used to create directories and append text.
   */
  constructor(path: string, fileSystem: IFileSystem) {
    this.path = path;
    this.fileSystem = fileSystem;
  }

  /**
   * Ensures the parent directory, then appends the batch without retaining an open handle.
   * @param text Batch text to append to the configured file.
   * @returns Resolves after append; rejects if directory preparation or append fails.
   */
  public async write(text: string): Promise<void> {
    const directory = FilePaths.parentDirectory(this.path);
    if (directory !== undefined) {
      await this.fileSystem.ensureDirectory(directory);
    }
    await this.fileSystem.appendText(this.path, text);
  }
}
