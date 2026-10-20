import type { IFileSystem } from "../../../application/ports/outbound/IFileSystem.port.js";

/** The real file system. `node:fs/promises` is loaded on first use so browser bundles never touch it. */
export class NodeFileSystem implements IFileSystem {
  async ensureDirectory(path: string): Promise<void> {
    const fileSystem = await import("node:fs/promises");
    await fileSystem.mkdir(path, { recursive: true });
  }

  async appendText(path: string, text: string): Promise<void> {
    const fileSystem = await import("node:fs/promises");
    await fileSystem.appendFile(path, text, "utf8");
  }
}
