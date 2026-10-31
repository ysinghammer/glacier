import type { IFileSystem } from "../../../../application/transports/ports/outbound/IFileSystem.port.js";

/** Implements filesystem operations with Node's promise API, loaded only when an operation runs. */
export class NodeFileSystem implements IFileSystem {
  /**
   * Creates the directory path and any missing parents using Node's recursive mkdir behavior.
   * @param path Directory path to create; existing directories are accepted.
   * @returns Resolves when the directory exists; rejects if Node's operation fails.
   */
  public async ensureDirectory(path: string): Promise<void> {
    const fileSystem = await import("node:fs/promises");
    await fileSystem.mkdir(path, { recursive: true });
  }

  /**
   * Appends UTF-8 text to a file, creating the file if it does not exist.
   * @param path File path to append to.
   * @param text UTF-8 text to append; existing file contents are preserved.
   * @returns Resolves after append; rejects if Node's filesystem operation fails.
   */
  public async appendText(path: string, text: string): Promise<void> {
    const fileSystem = await import("node:fs/promises");
    await fileSystem.appendFile(path, text, "utf8");
  }
}
