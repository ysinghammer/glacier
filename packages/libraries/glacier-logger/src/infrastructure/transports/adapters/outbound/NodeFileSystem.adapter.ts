import type { IFileSystem } from "../../../../application/transports/ports/outbound/IFileSystem.port.js";

/** The real file system. `node:fs/promises` is loaded on first use so browser bundles never touch it. */
export class NodeFileSystem implements IFileSystem {
  public async ensureDirectory(path: string): Promise<void> {
    const fileSystem = await import("node:fs/promises");
    await fileSystem.mkdir(path, { recursive: true });
  }

  public async appendText(path: string, text: string): Promise<void> {
    const fileSystem = await import("node:fs/promises");
    await fileSystem.appendFile(path, text, "utf8");
  }
}
