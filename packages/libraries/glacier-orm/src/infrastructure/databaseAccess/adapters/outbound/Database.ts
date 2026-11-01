import type { Pool } from "pg";
import type { IQueryable } from "../../../../application/databaseAccess/ports/inbound/IQueryable.port.js";
import type { ITransactionOptions } from "../../../../application/databaseAccess/types/ITransactionOptions.js";
import type { IQueryEvent } from "./IQueryEvent.js";
import { QueryConnection } from "./QueryConnection.js";
import { Transaction } from "./Transaction.js";

/** Explicitly managed PostgreSQL pool with validated query and transaction operations. */
export class Database extends QueryConnection implements IQueryable {
  /** Underlying pool escape hatch; this database owns its shutdown. */
  public readonly pool: Pool;

  /**
   * Creates a database around a pool; callers must eventually close it.
   * @param pool Pool owned by this database.
   * @param onQuery Optional query observer; asynchronous completion is awaited.
   */
  public constructor(pool: Pool, onQuery?: (event: IQueryEvent) => void | Promise<void>) {
    super(pool, onQuery);
    this.pool = pool;
  }

  /**
   * Runs callback work on a dedicated client in a PostgreSQL transaction.
   * @template T Callback result type.
   * @param callback Work to perform using the transaction handle.
   * @param options Optional top-level isolation selection.
   * @returns A promise for the callback result after commit and client release.
   */
  public transaction<T>(
    callback: (tx: IQueryable) => Promise<T>,
    options?: ITransactionOptions,
  ): Promise<T> {
    return Transaction.start(this.pool, this.onQuery, callback, options);
  }

  /**
   * Ends the underlying pool, including a pool supplied by the caller.
   * @returns A promise resolved when the pool has ended.
   */
  public close(): Promise<void> {
    return this.pool.end();
  }

  /**
   * Leaves lifecycle validation of the pool to node-postgres.
   * @returns No value.
   */
  protected override assertUsable(): void {}
}
