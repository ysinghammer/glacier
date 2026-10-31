/** File operations required by the file transport. */
export interface IFileSystem {
  /** Ensures a directory exists, creating missing parents as needed.
   * @param path Directory path to create or retain.
   * @returns Promise resolves when the directory exists; rejects if creation fails.
   */
  ensureDirectory(path: string): Promise<void>;
  /** Appends text, creating a missing file and closing it after the write.
   * @param path File path receiving the text.
   * @param text Text appended to the file.
   * @returns Promise resolves after append and close; rejects if either operation fails.
   */
  appendText(path: string, text: string): Promise<void>;
}
