import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open, readdir } from "node:fs/promises";
import { join } from "node:path";
import { MigrationNames } from "../../../../domain/migration/MigrationNames.js";
import type { IMigration } from "../../../../domain/migration/IMigration.js";
import type { IMigrationLoadResult } from "../../../../application/migration/ports/outbound/IMigrationLoadResult.js";

/** Loads validated SQL files without following symbolic links. */
export class MigrationDirectory {
  /**
   * Reads one directory and checks names, regular files, checksums and UTF-8 contents.
   * @param directory Caller-selected migration directory.
   * @returns Loaded migrations or an invalid filename/sequence rejection.
   */
  public static async load(directory: string): Promise<IMigrationLoadResult> {
    const entries = await readdir(directory, { withFileTypes: true });
    const validation = MigrationNames.validate(entries.map((entry) => entry.name));
    if (!validation.ok) return validation;
    const migrations: IMigration[] = [];
    for (const name of validation.names) {
      migrations.push(await this.read(directory, name));
    }
    return { ok: true, migrations };
  }

  /**
   * Opens one regular file without following links and hashes its exact bytes.
   * @param directory Directory containing the validated name.
   * @param name Validated migration filename.
   * @returns A promise for the decoded migration after its file handle closes.
   * @throws {Error} The promise rejects if the opened file is not regular.
   */
  private static async read(directory: string, name: string): Promise<IMigration> {
    const handle = await open(
      join(directory, name),
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
    try {
      if (!(await handle.stat()).isFile()) throw new Error("Migration is not a regular file");
      const bytes = await handle.readFile();
      const sql = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      return {
        sequence: Number(name.slice(0, 4)),
        name,
        checksum: createHash("sha256").update(bytes).digest("hex"),
        sql,
        isTransactional: !/^-- glacier:no-transaction(?:\r?\n|$)/.test(sql),
      };
    } finally {
      await handle.close();
    }
  }
}
