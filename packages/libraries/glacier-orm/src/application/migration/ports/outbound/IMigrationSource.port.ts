import type { IMigrationLoadResult } from "./IMigrationLoadResult.js";

/** Reads and validates the caller-selected migration directory. */
export interface IMigrationSource {
  /**
   * Loads immutable migration contents and identity.
   * @param directory Caller-selected migration directory.
   * @returns Loaded migrations or an invalid-name rejection after all handles close.
   */
  load(directory: string): Promise<IMigrationLoadResult>;
}
