import type { IFileSystem } from "../../index.js";

/** Implements the injected file-system contract with inspectable memory-backed paths and contents. */
export class InMemoryFileSystem implements IFileSystem {
  /**
   * Readonly array reference of mutable directory paths requested by transports, including repeats.
   * @default An empty array
   */
  public readonly directories: string[] = [];
  /**
   * Mutable file contents keyed by path; appends update the matching value.
   * @default An empty map
   */
  public readonly files = new Map<string, string>();
  /**
   * Optional failure returned by the next and subsequent append operations.
   * @default `undefined`
   */
  public appendFailure: Error | undefined;

  /**
   * Records a directory request without accessing the host file system.
   * @param path Directory path requested by the caller.
   * @returns A promise that resolves after recording the request.
   */
  public ensureDirectory(path: string): Promise<void> {
    this.directories.push(path);
    return Promise.resolve();
  }

  /**
   * Appends text in memory or rejects with the configured failure.
   * @param path File path whose in-memory content is extended.
   * @param text Text appended verbatim to the existing content.
   * @returns A promise fulfilled after append, or rejected with {@link appendFailure}.
   */
  public appendText(path: string, text: string): Promise<void> {
    if (this.appendFailure !== undefined) {
      return Promise.reject(this.appendFailure);
    }
    this.files.set(path, `${this.files.get(path) ?? ""}${text}`);
    return Promise.resolve();
  }
}
