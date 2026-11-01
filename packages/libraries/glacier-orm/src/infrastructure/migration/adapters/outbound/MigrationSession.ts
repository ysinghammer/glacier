import pg from "pg";
import type { IMigration } from "../../../../domain/migration/IMigration.js";
import type {
  IMigrationHistory,
  IMigrationSession,
} from "../../../../application/migration/ports/outbound/IMigrationSession.port.js";

// Stable PostgreSQL advisory lock namespace and key: ASCII "glac" and "migr".
const MIGRATION_LOCK_NAMESPACE = 0x676c6163;
const MIGRATION_LOCK_KEY = 0x6d696772;

/** PostgreSQL migration session whose advisory lock lasts until its client closes. */
export class MigrationSession implements IMigrationSession {
  /** Dedicated PostgreSQL client owned by this session. */
  private readonly client: pg.Client;
  /** Unexpected asynchronous connection errors retained until close. */
  private readonly errors: Error[] = [];

  /**
   * Constructs an unconnected client without exposing its connection URL.
   * @param connectionString PostgreSQL connection URL.
   */
  public constructor(connectionString: string) {
    this.client = new pg.Client({ connectionString });
    this.client.on("error", (error: Error) => {
      this.errors.push(error);
    });
  }

  /**
   * Opens the client and obtains the database-wide migration advisory lock.
   * @returns A promise resolved after the lock is acquired.
   */
  public async open(): Promise<void> {
    await this.client.connect();
    await this.client.query("select pg_advisory_lock($1::integer, $2::integer)", [
      MIGRATION_LOCK_NAMESPACE,
      MIGRATION_LOCK_KEY,
    ]);
  }

  /**
   * Creates the migration history table and reads its ordered records.
   * @returns A promise for recorded migration identities.
   */
  public async history(): Promise<readonly IMigrationHistory[]> {
    await this.client.query(
      "create table if not exists glacier_migrations (sequence integer primary key, name text not null unique, checksum text not null, applied_at timestamptz not null default now())",
    );
    return (
      await this.client.query<IMigrationHistory>(
        "select sequence, name, checksum from glacier_migrations order by sequence",
      )
    ).rows;
  }

  /**
   * Begins the next migration's transaction.
   * @returns A promise resolved after the transaction starts.
   */
  public async begin(): Promise<void> {
    await this.client.query("begin");
  }

  /**
   * Executes a validated migration file on this session.
   * @param migration Migration whose SQL will be executed.
   * @returns A promise resolved after SQL execution.
   */
  public async execute(migration: IMigration): Promise<void> {
    await this.client.query(migration.sql);
  }

  /**
   * Records migration identity on this session.
   * @param migration Migration whose checksum will be recorded.
   * @returns A promise resolved after insertion.
   */
  public async record(migration: IMigration): Promise<void> {
    await this.client.query(
      "insert into glacier_migrations (sequence, name, checksum) values ($1, $2, $3)",
      [migration.sequence, migration.name, migration.checksum],
    );
  }

  /**
   * Commits the active transaction.
   * @returns A promise resolved after commit.
   */
  public async commit(): Promise<void> {
    await this.client.query("commit");
  }

  /**
   * Rolls back the active transaction.
   * @returns A promise resolved after rollback.
   */
  public async rollback(): Promise<void> {
    await this.client.query("rollback");
  }

  /**
   * Closes the client, releasing its advisory lock, and reports asynchronous connection errors.
   * @returns A promise resolved after successful closure.
   * @throws {AggregateError} The promise rejects if the connection emitted an asynchronous error.
   */
  public async close(): Promise<void> {
    await this.client.end();
    if (this.errors.length > 0) throw new AggregateError(this.errors, "Migration session failed");
  }
}
