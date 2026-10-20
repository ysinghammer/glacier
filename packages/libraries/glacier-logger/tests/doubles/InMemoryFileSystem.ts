import type { IFileSystem } from "../../index.js";

/** Test-owned file system that keeps files in memory and can fail on demand. */
export class InMemoryFileSystem implements IFileSystem {
  readonly directories: string[] = [];
  readonly files = new Map<string, string>();
  appendFailure: Error | undefined;

  ensureDirectory(path: string): Promise<void> {
    this.directories.push(path);
    return Promise.resolve();
  }

  appendText(path: string, text: string): Promise<void> {
    if (this.appendFailure !== undefined) {
      return Promise.reject(this.appendFailure);
    }
    this.files.set(path, `${this.files.get(path) ?? ""}${text}`);
    return Promise.resolve();
  }
}
