import { MigrationDirectory } from "../outbound/MigrationDirectory.js";
import { MigrationRunner } from "../../../../application/migration/MigrationRunner.js";
import { MigrationSession } from "../outbound/MigrationSession.js";
import type { IMigrationArguments } from "./IMigrationArguments.js";

/** CLI boundary for forward PostgreSQL migrations with secret-safe diagnostics. */
export class MigrationCommand {
  /**
   * Validates invocation, executes migrations and writes a secret-safe result to the terminal.
   * @param args Command arguments after the executable name.
   * @param environmentUrl Optional DATABASE_URL fallback.
   * @returns Exit code 0 on success, 2 for usage, or 1 for migration failure.
   */
  public static async run(
    args: readonly string[],
    environmentUrl: string | undefined,
  ): Promise<number> {
    const options = this.parse(args, environmentUrl);
    if (!options.ok) {
      console.error("Usage: glacier-orm migrate --dir <path> [--database-url <url>]");
      return 2;
    }
    try {
      const result = await MigrationRunner.run(
        MigrationDirectory,
        new MigrationSession(options.databaseUrl),
        options.directory,
      );
      if (!result.ok) {
        if (result.reason === "names") {
          console.error("Invalid migration filename or sequence.");
          return 1;
        }
        console.error("Migration history or checksum mismatch.");
        return 1;
      }
      console.log(`Applied ${result.applied} migration(s).`);
      return 0;
    } catch {
      console.error("Migration failed; check the migration directory and database connection.");
      return 1;
    }
  }

  /**
   * Parses the sole migration command and validates its PostgreSQL connection URL.
   * @param args Command arguments after the executable name.
   * @param environmentUrl Fallback URL used only when no option is supplied.
   * @returns Parsed values or a usage rejection without echoing input.
   */
  private static parse(
    args: readonly string[],
    environmentUrl: string | undefined,
  ): IMigrationArguments {
    if (args[0] !== "migrate") return { ok: false };
    const options = new Map<string, string>();
    for (let index = 1; index < args.length; index += 2) {
      const option = args[index];
      const value = args[index + 1];
      if (option !== "--dir" && option !== "--database-url") return { ok: false };
      if (
        options.has(option) ||
        value === undefined ||
        value.length === 0 ||
        value.startsWith("--")
      )
        return { ok: false };
      options.set(option, value);
    }
    const directory = options.get("--dir");
    const databaseUrl = options.get("--database-url") ?? environmentUrl;
    if (directory === undefined || databaseUrl === undefined || !this.isPostgresUrl(databaseUrl))
      return { ok: false };
    return { ok: true, directory, databaseUrl };
  }

  /**
   * Recognizes absolute PostgreSQL URLs without exposing their contents.
   * @param value Untrusted connection URL.
   * @returns Whether the URL has a PostgreSQL scheme and hostname.
   */
  private static isPostgresUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return (
        (url.protocol === "postgres:" || url.protocol === "postgresql:") && url.hostname.length > 0
      );
    } catch {
      return false;
    }
  }
}
