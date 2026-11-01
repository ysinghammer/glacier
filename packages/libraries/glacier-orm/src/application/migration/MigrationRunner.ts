import type { IMigration } from "../../domain/migration/IMigration.js";
import type { IMigrationSource } from "./ports/outbound/IMigrationSource.port.js";
import type { IMigrationSession } from "./ports/outbound/IMigrationSession.port.js";
import type { IMigrationRunResult } from "./IMigrationRunResult.js";

/** Coordinates immutable forward migrations on one locked session. */
export class MigrationRunner {
  /**
   * Loads and applies pending migrations while owning the session lifecycle.
   * @param source Source of validated migration files.
   * @param session Dedicated migration session; not opened when file names are rejected.
   * @param directory Caller-selected migration directory.
   * @returns Applied count, invalid names, or a history mismatch after any opened session closes.
   * @throws {AggregateError} Promise rejects on execution failure, including any cleanup failure.
   */
  public static async run(
    source: IMigrationSource,
    session: IMigrationSession,
    directory: string,
  ): Promise<IMigrationRunResult> {
    const loaded = await source.load(directory);
    if (!loaded.ok) return { ok: false, reason: "names" };
    let result: IMigrationRunResult;
    try {
      await session.open();
      result = await this.apply(session, loaded.migrations);
    } catch (error) {
      try {
        await session.close();
      } catch (closeError) {
        throw new AggregateError([error, closeError], "Migration and close failed");
      }
      throw new AggregateError([error], "Migration session failed");
    }
    await session.close();
    return result;
  }

  /**
   * Validates the immutable history prefix and executes pending files.
   * @param session Connected session holding the migration lock.
   * @param migrations Ordered local migration files.
   * @returns Applied count or a history mismatch.
   */
  private static async apply(
    session: IMigrationSession,
    migrations: readonly IMigration[],
  ): Promise<IMigrationRunResult> {
    const history = await session.history();
    for (const [index, row] of history.entries()) {
      const migration = migrations[index];
      if (
        migration === undefined ||
        row.sequence !== migration.sequence ||
        row.name !== migration.name ||
        row.checksum !== migration.checksum
      )
        return { ok: false, reason: "history" };
    }
    for (const migration of migrations.slice(history.length))
      await this.execute(session, migration);
    return { ok: true, applied: migrations.length - history.length };
  }

  /**
   * Executes a file and records its checksum, using one transaction unless explicitly opted out.
   * @param session Connected session holding the migration lock.
   * @param migration File to execute and record.
   * @returns A promise resolved once the file and history write finish.
   * @throws {AggregateError} Promise rejects on execution failure, including any rollback failure.
   */
  private static async execute(session: IMigrationSession, migration: IMigration): Promise<void> {
    if (!migration.isTransactional) {
      await this.executeAndRecord(session, migration);
      return;
    }
    await session.begin();
    try {
      await this.executeAndRecord(session, migration);
      await session.commit();
    } catch (error) {
      try {
        await session.rollback();
      } catch (rollbackError) {
        throw new AggregateError([error, rollbackError], "Migration and rollback failed");
      }
      throw new AggregateError([error], "Migration failed");
    }
  }

  /**
   * Sends the migration SQL and then inserts its immutable history record.
   * @param session Connected migration session.
   * @param migration SQL and checksum to persist.
   * @returns A promise resolved after both queries succeed.
   */
  private static async executeAndRecord(
    session: IMigrationSession,
    migration: IMigration,
  ): Promise<void> {
    await session.execute(migration);
    await session.record(migration);
  }
}
