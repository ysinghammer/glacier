/** Locates the parent directory of a file path written with `/` or `\` separators. */
export class FilePaths {
  /** Returns the directory part of `path`, or `undefined` when the file sits in the working directory or the root. */
  static parentDirectory(path: string): string | undefined {
    const separatorIndex = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
    if (separatorIndex <= 0) {
      return undefined;
    }
    return path.slice(0, separatorIndex);
  }
}
