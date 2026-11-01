import pg from "pg";
import type { Pool, PoolConfig } from "pg";
import { Database } from "./Database.js";
import type { IQueryEvent } from "./IQueryEvent.js";

/** Pool configuration and optional execution diagnostics. */
export interface IDbOptions {
  /** Existing pool, mutually exclusive with poolConfig; close ends this pool too. */
  readonly pool?: Pool;
  /** Configuration for a newly constructed lazy pool. */
  readonly poolConfig?: PoolConfig;
  /**
   * Receives each PostgreSQL execution event without bound values.
   * @param event Execution metadata; SQL text may contain sensitive literals.
   * @returns No value or a promise that completes observation; failures propagate.
   */
  readonly onQuery?: (event: IQueryEvent) => void | Promise<void>;
}

/** Constructs explicit PostgreSQL database resources without connecting at import time. */
export class DbFactory {
  /**
   * Creates a database using an existing pool or a new lazily connected pool.
   * @param options Pool selection and optional query hook.
   * @returns Database owning the selected pool; call close when finished.
   * @throws {TypeError} If both pool and poolConfig are provided.
   */
  public static create(options: IDbOptions): Database {
    if (options.pool !== undefined && options.poolConfig !== undefined) {
      throw new TypeError("Specify either pool or poolConfig, not both");
    }
    return new Database(options.pool ?? new pg.Pool(options.poolConfig), options.onQuery);
  }
}
