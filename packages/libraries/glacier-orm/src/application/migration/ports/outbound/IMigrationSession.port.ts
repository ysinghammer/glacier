import type { IMigration } from "../../../../domain/migration/IMigration.js";

/** Persisted migration identity read from the database. */
export interface IMigrationHistory {
  /** One-based migration sequence number. */
  readonly sequence: number;
  /** Recorded filename. */
  readonly name: string;
  /** SHA-256 checksum recorded when applied. */
  readonly checksum: string;
}

/** Dedicated, serialized migration connection with explicit lifecycle and transactions. */
export interface IMigrationSession {
  /**
   * Opens the connection and acquires its session-scoped migration lock.
   * @returns A promise resolved when the session is ready.
   */
  open(): Promise<void>;
  /**
   * Creates storage if needed and reads ordered immutable history under the lock.
   * @returns A promise for recorded migration identities.
   */
  history(): Promise<readonly IMigrationHistory[]>;
  /**
   * Starts a transaction on the dedicated session.
   * @returns A promise resolved after the transaction starts.
   */
  begin(): Promise<void>;
  /**
   * Executes a migration's SQL without creating an additional session.
   * @param migration Validated migration to execute.
   * @returns A promise resolved after SQL execution.
   */
  execute(migration: IMigration): Promise<void>;
  /**
   * Records an executed migration in the current transaction or session.
   * @param migration Migration whose immutable identity is recorded.
   * @returns A promise resolved after the history write.
   */
  record(migration: IMigration): Promise<void>;
  /**
   * Commits the active transaction.
   * @returns A promise resolved after commit.
   */
  commit(): Promise<void>;
  /**
   * Rolls back the active transaction after a failed migration.
   * @returns A promise resolved after rollback.
   */
  rollback(): Promise<void>;
  /**
   * Closes the connection and releases its session-scoped lock.
   * @returns A promise resolved after closure; asynchronous session errors remain observable.
   */
  close(): Promise<void>;
}
