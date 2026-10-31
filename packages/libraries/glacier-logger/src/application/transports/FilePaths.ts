/** Extracts a parent directory from paths using `/` or `\\` separators. */
export class FilePaths {
  /** Returns the path prefix before its final slash or backslash.
   * @param path File path to inspect.
   * @returns Parent path, or undefined when no non-root parent is present.
   */
  public static parentDirectory(path: string): string | undefined {
    const separatorIndex = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
    if (separatorIndex <= 0) {
      return undefined;
    }
    return path.slice(0, separatorIndex);
  }
}
