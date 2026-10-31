import type { IFileSystem } from "../../index.js";

/** Test-owned file system that keeps files in memory and can fail on demand. */
export class InMemoryFileSystem implements IFileSystem {
  public readonly directories: string[] = [];
  public readonly files = new Map<string, string>();
  public appendFailure: Error | undefined;

  public ensureDirectory(path: string): Promise<void> {
    this.directories.push(path);
    return Promise.resolve();
  }

  public appendText(path: string, text: string): Promise<void> {
    if (this.appendFailure !== undefined) {
      return Promise.reject(this.appendFailure);
    }
    this.files.set(path, `${this.files.get(path) ?? ""}${text}`);
    return Promise.resolve();
  }
}
