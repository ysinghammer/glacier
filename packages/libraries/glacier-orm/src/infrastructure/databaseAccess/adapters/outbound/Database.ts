import type { IConstructableClass } from "@glacier/reflection";
import pg from "pg";
import type { Pool, QueryResult } from "pg";
import { RowMapper } from "../../../../application/rowMapping/Row.mapper.js";
import type { IQueryable } from "../../../../application/databaseAccess/ports/inbound/IQueryable.port.js";
import type { IExecutionResult } from "../../../../application/databaseAccess/types/IExecutionResult.js";
import { NoRowsError } from "../../../../domain/errorHandling/errors/NoRows.error.js";
import { TooManyRowsError } from "../../../../domain/errorHandling/errors/TooManyRows.error.js";
import type { SqlFragment } from "../../../../domain/sqlComposition/SqlFragment.js";
import { PgErrors } from "../../../errorHandling/adapters/outbound/PgErrors.js";
import type { IQueryEvent } from "./IQueryEvent.js";

/** Explicitly managed PostgreSQL pool with validated result operations. */
export class Database implements IQueryable {
  /** Underlying pool escape hatch; this database owns its shutdown. */
  public readonly pool: Pool;

  /** Optional observer of query execution, excluding parameter values. */
  private readonly onQuery: ((event: IQueryEvent) => void | Promise<void>) | undefined;

  /**
   * Creates a database around a pool; callers must eventually close it.
   * @param pool Pool owned by this database.
   * @param onQuery Optional query observer; asynchronous completion is awaited.
   */
  public constructor(pool: Pool, onQuery?: (event: IQueryEvent) => void | Promise<void>) {
    this.pool = pool;
    this.onQuery = onQuery;
  }

  /**
   * Executes a statement and validates all returned rows.
   * @template T Schema instance type.
   * @param target Result schema class.
   * @param sql Parameterized statement.
   * @returns A promise for validated rows, including an empty array for no rows.
   */
  public async query<T extends object>(
    target: IConstructableClass<T>,
    sql: SqlFragment,
  ): Promise<T[]> {
    const result = this.singleResult(await this.run(sql));
    return RowMapper.map(target, result.rows);
  }

  /**
   * Executes a statement with the same zero-or-more semantics as query.
   * @template T Schema instance type.
   * @param target Result schema class.
   * @param sql Parameterized statement.
   * @returns A promise for validated rows.
   */
  public many<T extends object>(target: IConstructableClass<T>, sql: SqlFragment): Promise<T[]> {
    return this.query(target, sql);
  }

  /**
   * Executes a statement requiring exactly one validated row.
   * @template T Schema instance type.
   * @param target Result schema class.
   * @param sql Parameterized statement.
   * @returns A promise for the row.
   * @throws {NoRowsError} If no row is returned.
   */
  public async one<T extends object>(target: IConstructableClass<T>, sql: SqlFragment): Promise<T> {
    const result = await this.maybeOne(target, sql);
    if (result === undefined) throw new NoRowsError();
    return result;
  }

  /**
   * Executes a statement requiring at most one validated row.
   * @template T Schema instance type.
   * @param target Result schema class.
   * @param sql Parameterized statement.
   * @returns A promise for the row, or undefined for no rows.
   * @throws {TooManyRowsError} If more than one row is returned.
   */
  public async maybeOne<T extends object>(
    target: IConstructableClass<T>,
    sql: SqlFragment,
  ): Promise<T | undefined> {
    const result = this.singleResult(await this.run(sql));
    if (result.rows.length > 1) throw new TooManyRowsError();
    return RowMapper.map(target, result.rows)[0];
  }

  /**
   * Executes SQL and preserves each PostgreSQL command's row count.
   * @param sql Parameterized statement.
   * @returns A promise for one count or ordered counts; null means a count is unavailable.
   */
  public async execute(sql: SqlFragment): Promise<IExecutionResult> {
    const result = await this.run(sql);
    return this.rowCounts(result);
  }

  /**
   * Ends the underlying pool, including a pool supplied by the caller.
   * @returns A promise resolved when the pool has ended.
   */
  public close(): Promise<void> {
    return this.pool.end();
  }

  /**
   * Runs compiled SQL through the pool and emits one execution event without bound values.
   * @param sql Statement whose values are passed only to PostgreSQL.
   * @returns A promise for the raw PostgreSQL result.
   * @throws {Error} If PostgreSQL execution fails or the observer fails.
   * @throws {AggregateError} If execution and the observer both fail.
   */
  private async run(sql: SqlFragment): Promise<QueryResult | QueryResult[]> {
    const compiled = sql.compile();
    const start = performance.now();
    let result: QueryResult | QueryResult[];
    try {
      // pg's types omit the array returned by its simple protocol for multiple commands.
      result = await this.pool.query(compiled.text, compiled.values);
    } catch (error: unknown) {
      const mapped = this.failure(PgErrors.map(error));
      try {
        await this.notify({
          text: compiled.text,
          durationMs: performance.now() - start,
          rowCount: null,
          error: new Error("PostgreSQL query failed"),
        });
      } catch (hookError: unknown) {
        throw new AggregateError([mapped, hookError], "PostgreSQL query and observer failed");
      }
      throw mapped;
    }
    await this.notify({
      text: compiled.text,
      durationMs: performance.now() - start,
      rowCount: this.rowCounts(result),
      error: undefined,
    });
    return result;
  }

  /**
   * Removes unsafe server messages from unmapped database failures while retaining their cause.
   * @param error Translated PostgreSQL failure or another caught value.
   * @returns An error with a safe summary for unknown server and non-Error failures.
   */
  private failure(error: unknown): Error {
    if (error instanceof pg.DatabaseError || !(error instanceof Error)) {
      return new Error("PostgreSQL query failed", { cause: error });
    }
    return error;
  }

  /**
   * Awaits an observer and normalizes non-Error rejections into exceptional failures.
   * @param event Execution metadata; SQL text may contain sensitive literals.
   * @returns A promise resolved after the observer completes.
   * @throws {Error} If the observer fails, retaining non-Error values as causes.
   */
  private async notify(event: IQueryEvent): Promise<void> {
    try {
      await this.onQuery?.(event);
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      throw new Error("Query observer failed", { cause: error });
    }
  }

  /**
   * Rejects multi-result statements for APIs expecting a single result set.
   * @param result PostgreSQL response after execution has completed.
   * @returns The single query result.
   * @throws {Error} If PostgreSQL returned multiple statement results.
   */
  private singleResult(result: QueryResult | QueryResult[]): QueryResult {
    if (Array.isArray(result))
      throw new Error("Multiple statement results cannot be mapped as rows");
    return result;
  }

  /**
   * Extracts PostgreSQL counts without inventing counts for commands that omit them.
   * @param result Single or multi-statement PostgreSQL response.
   * @returns One count or a new ordered array of counts, preserving nulls.
   */
  private rowCounts(result: QueryResult | QueryResult[]): IExecutionResult {
    if (Array.isArray(result)) return result.map((item) => item.rowCount);
    return result.rowCount;
  }
}
