import type { Pool, PoolClient, QueryResult } from "pg";
import { Sql } from "../../../../application/sqlComposition/Sql.js";
import type { IQueryable } from "../../../../application/databaseAccess/ports/inbound/IQueryable.port.js";
import type { ITransactionOptions } from "../../../../application/databaseAccess/types/ITransactionOptions.js";
import { CommittedObserverError } from "../../../../domain/errorHandling/errors/CommittedObserver.error.js";
import { CommittedReleaseError } from "../../../../domain/errorHandling/errors/CommittedRelease.error.js";
import type { IQueryEvent } from "./IQueryEvent.js";
import { QueryConnection } from "./QueryConnection.js";

/** Shared state for one checked-out connection and its nested savepoints. */
interface ITransactionState {
  /** Whether the outer callback still owns its client. */
  isActive: boolean;
  /** Monotonically increasing identifier for generated savepoints. */
  sequence: number;
  /** Cleanup failure that requires the enclosing transaction to roll back. */
  failure: Error | undefined;
}

/**
 * Callback result or failure retained until client release completes.
 * @template T Successful callback result type.
 * @property ok Distinguishes success from failure.
 * @property value Callback result, present only on success.
 * @property error Transaction failure, present only on failure.
 */
type ITransactionOutcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: Error };

/** Callback-scoped transaction on one checked-out PostgreSQL client. */
export class Transaction extends QueryConnection implements IQueryable {
  /** Checked-out client, owned and released by the outermost transaction. */
  private readonly client: PoolClient;
  /** State shared by handles on the same connection. */
  private readonly state: ITransactionState;
  /** Whether this callback may still use the handle. */
  private isActive = true;
  /** Whether a nested callback currently owns the connection. */
  private hasChild = false;

  /**
   * Creates a callback-scoped handle for an already checked-out client.
   * @param client Client owned by the outer transaction.
   * @param onQuery Optional awaited query observer.
   * @param state State shared with nested handles.
   */
  private constructor(
    client: PoolClient,
    onQuery: ((event: IQueryEvent) => void | Promise<void>) | undefined,
    state: ITransactionState,
  ) {
    super(client, onQuery);
    this.client = client;
    this.state = state;
  }

  /**
   * Acquires a client and owns its transaction and release on every path.
   * @template T Callback result type.
   * @param pool Pool supplying the dedicated client.
   * @param onQuery Optional awaited observer.
   * @param callback Work to execute within the transaction.
   * @param options Optional isolation selection.
   * @returns A promise for the callback result after cleanup.
   * @throws {Error} If transaction execution or cleanup fails.
   */
  public static async start<T>(
    pool: Pool,
    onQuery: ((event: IQueryEvent) => void | Promise<void>) | undefined,
    callback: (tx: IQueryable) => Promise<T>,
    options?: ITransactionOptions,
  ): Promise<T> {
    const begin = Transaction.beginStatement(options);
    const client = await pool.connect();
    const tx = new Transaction(client, onQuery, {
      isActive: true,
      sequence: 0,
      failure: undefined,
    });
    let outcome: ITransactionOutcome<T>;
    let isOpen = false;
    let isCommitted = false;
    let mustDiscard = false;
    try {
      await tx.command(begin, () => {
        isOpen = true;
      });
      const result = await callback(tx);
      tx.isActive = false;
      tx.state.isActive = false;
      if (tx.state.failure !== undefined) throw tx.state.failure;
      const commit = await tx.command("COMMIT", (response) => {
        if (response.command === "COMMIT") {
          isOpen = false;
          isCommitted = true;
        }
      });
      if (commit.command !== "COMMIT")
        throw new Error("PostgreSQL rolled back the transaction instead of committing");
      outcome = { ok: true, value: result };
    } catch (caught: unknown) {
      tx.isActive = false;
      tx.state.isActive = false;
      let failure = Transaction.asError(caught);
      if (isCommitted) failure = new CommittedObserverError(failure);
      if (isOpen) {
        try {
          await tx.command("ROLLBACK");
        } catch (rollbackFailure: unknown) {
          failure = Transaction.combine(
            failure,
            rollbackFailure,
            "Transaction and rollback failed",
          );
          mustDiscard = true;
        }
      } else if (!isCommitted) {
        mustDiscard = true;
      }
      outcome = { ok: false, error: failure };
    }
    outcome = Transaction.release(client, mustDiscard, isCommitted, outcome);
    if (!outcome.ok) throw outcome.error;
    return outcome.value;
  }

  /**
   * Releases the client and retains any release failure alongside the transaction outcome.
   * @template T Callback result type.
   * @param client Checked-out client to release.
   * @param mustDiscard Whether the client cannot safely return to the pool.
   * @param isCommitted Whether PostgreSQL confirmed a successful commit.
   * @param outcome Callback result or prior transaction failure.
   * @returns The original outcome or a failure preserving all release errors.
   */
  private static release<T>(
    client: PoolClient,
    mustDiscard: boolean,
    isCommitted: boolean,
    outcome: ITransactionOutcome<T>,
  ): ITransactionOutcome<T> {
    try {
      client.release(mustDiscard);
    } catch (releaseFailure: unknown) {
      const releaseError = isCommitted
        ? new CommittedReleaseError(releaseFailure)
        : Transaction.asError(releaseFailure);
      return {
        ok: false,
        error: outcome.ok
          ? releaseError
          : Transaction.combine(
              outcome.error,
              releaseError,
              "Transaction and client release failed",
            ),
      };
    }
    return outcome;
  }

  /**
   * Runs a nested callback under a uniquely named savepoint.
   * @template T Callback result type.
   * @param callback Work using the nested handle.
   * @param options Nested calls must not specify isolation.
   * @returns A promise for the callback result after savepoint release.
   * @throws {Error} If the handle is unavailable, isolation is specified, or cleanup fails.
   */
  public async transaction<T>(
    callback: (tx: IQueryable) => Promise<T>,
    options?: ITransactionOptions,
  ): Promise<T> {
    this.assertUsable();
    if (options?.isolation !== undefined)
      throw new Error("Nested transactions cannot specify isolation");
    this.hasChild = true;
    const name = `glacier_savepoint_${++this.state.sequence}`;
    const child = new Transaction(this.client, this.onQuery, this.state);
    let isOpen = false;
    try {
      await child.command(`SAVEPOINT ${name}`, () => {
        isOpen = true;
      });
      const result = await callback(child);
      child.isActive = false;
      await child.command(`RELEASE SAVEPOINT ${name}`, () => {
        isOpen = false;
      });
      return result;
    } catch (caught: unknown) {
      child.isActive = false;
      let failure = Transaction.asError(caught);
      if (isOpen) {
        const cleanupFailure = await child.cleanupSavepoint(name);
        if (cleanupFailure !== undefined) {
          failure = Transaction.combine(
            failure,
            cleanupFailure,
            "Nested transaction and cleanup failed",
          );
          this.state.failure = failure;
        }
      } else {
        this.state.failure = failure;
      }
      throw failure;
    } finally {
      this.hasChild = false;
    }
  }

  /**
   * Attempts both savepoint cleanup commands even when observation or execution fails.
   * @param name Internally generated savepoint name.
   * @returns A promise for the cleanup failure, or undefined when both commands succeeded.
   */
  private async cleanupSavepoint(name: string): Promise<Error | undefined> {
    let failure: Error | undefined;
    try {
      await this.command(`ROLLBACK TO SAVEPOINT ${name}`);
    } catch (error: unknown) {
      failure = Transaction.asError(error);
    }
    try {
      await this.command(`RELEASE SAVEPOINT ${name}`);
    } catch (error: unknown) {
      failure =
        failure === undefined
          ? Transaction.asError(error)
          : Transaction.combine(failure, error, "Savepoint rollback and release failed");
    }
    return failure;
  }

  /**
   * Rejects queries after callback settlement or during an active nested callback.
   * @returns No value when this scope owns the client.
   * @throws {Error} If the handle is no longer available.
   */
  protected override assertUsable(): void {
    if (!this.isActive || !this.state.isActive || this.hasChild)
      throw new Error("Transaction handle is not available");
  }

  /**
   * Executes a trusted control statement and reports PostgreSQL completion before observation.
   * @param text Internally constructed transaction-control SQL.
   * @param onExecuted Optional callback receiving the successful PostgreSQL response.
   * @returns A promise for the control response.
   */
  private async command(
    text: string,
    onExecuted?: (result: QueryResult) => void,
  ): Promise<QueryResult> {
    // Each control string is one internally constructed command, so pg returns one result.
    const result = await this.runControl(Sql.raw(text), (response) => {
      onExecuted?.(response as QueryResult);
    });
    return result as QueryResult;
  }

  /**
   * Validates isolation before acquiring a pool client.
   * @param options Optional transaction isolation.
   * @returns Trusted BEGIN SQL.
   * @throws {TypeError} If the isolation level is unsupported.
   */
  private static beginStatement(options?: ITransactionOptions): string {
    const isolation = options?.isolation;
    if (isolation === undefined) return "BEGIN";
    if (
      isolation !== "read committed" &&
      isolation !== "repeatable read" &&
      isolation !== "serializable"
    ) {
      throw new TypeError("Unsupported transaction isolation");
    }
    return `BEGIN ISOLATION LEVEL ${isolation.toUpperCase()}`;
  }

  /**
   * Normalizes non-Error thrown values while retaining their cause.
   * @param caught Caught failure.
   * @returns The original Error or an Error carrying the thrown value.
   */
  private static asError(caught: unknown): Error {
    if (caught instanceof Error) return caught;
    return new Error("Transaction failed", { cause: caught });
  }

  /**
   * Preserves an original failure alongside an independent cleanup failure.
   * @param original Failure that initiated cleanup.
   * @param cleanup Failure encountered during cleanup.
   * @param message Secret-safe description of both failures.
   * @returns Aggregate containing both failures in occurrence order.
   */
  private static combine(original: Error, cleanup: unknown, message: string): AggregateError {
    return new AggregateError([original, Transaction.asError(cleanup)], message);
  }
}
