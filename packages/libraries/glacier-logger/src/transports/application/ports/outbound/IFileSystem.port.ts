/** The file operations the file transport needs. */
export interface IFileSystem {
  /** Creates `path` and any missing parents. Succeeds when it already exists. */
  ensureDirectory(path: string): Promise<void>;
  /** Appends `text` to the file at `path`, creating it when missing. The file is closed again afterwards. */
  appendText(path: string, text: string): Promise<void>;
}
