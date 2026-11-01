import type { IConstructableClass } from "@glacier/reflection";
import type { SqlFragment } from "../../../../domain/sqlComposition/SqlFragment.js";
import type { IExecutionResult } from "../../types/IExecutionResult.js";
import type { ITransactionOptions } from "../../types/ITransactionOptions.js";

/** Operations shared by databases and callback-scoped transaction handles. */
export interface IQueryable {
  /**
   * Executes a statement and validates every returned row.
   * @template T The schema instance type.
   * @param target Schema class for returned rows.
   * @param sql Parameterized statement.
   * @returns A promise for zero or more validated rows in database order.
   * @throws {Error} If PostgreSQL returned multiple statement results after execution.
   */
  query<T extends object>(target: IConstructableClass<T>, sql: SqlFragment): Promise<T[]>;

  /**
   * Executes a statement and validates every returned row, equivalent to query.
   * @template T The schema instance type.
   * @param target Schema class for returned rows.
   * @param sql Parameterized statement.
   * @returns A promise for zero or more validated rows in database order.
   * @throws {Error} If PostgreSQL returned multiple statement results after execution.
   */
  many<T extends object>(target: IConstructableClass<T>, sql: SqlFragment): Promise<T[]>;

  /**
   * Executes a statement expecting exactly one row.
   * @template T The schema instance type.
   * @param target Schema class for the returned row.
   * @param sql Parameterized statement.
   * @returns A promise for the validated row.
   * @throws {NoRowsError} If the statement returns no rows.
   * @throws {TooManyRowsError} If the statement returns more than one row.
   * @throws {Error} If PostgreSQL returned multiple statement results after execution.
   */
  one<T extends object>(target: IConstructableClass<T>, sql: SqlFragment): Promise<T>;

  /**
   * Executes a statement expecting at most one row.
   * @template T The schema instance type.
   * @param target Schema class for the returned row.
   * @param sql Parameterized statement.
   * @returns A promise for the validated row, or undefined if no row was returned.
   * @throws {TooManyRowsError} If the statement returns more than one row.
   * @throws {Error} If PostgreSQL returned multiple statement results after execution.
   */
  maybeOne<T extends object>(
    target: IConstructableClass<T>,
    sql: SqlFragment,
  ): Promise<T | undefined>;

  /**
   * Executes SQL and preserves PostgreSQL's row counts, including unavailable counts.
   * @param sql Parameterized statement.
   * @returns A promise for one count, or ordered counts for multiple results.
   */
  execute(sql: SqlFragment): Promise<IExecutionResult>;

  /**
   * Runs a callback atomically, using a savepoint when called on a transaction handle.
   * @template T Callback result type.
   * @param callback Work to perform using the supplied transaction handle.
   * @param options Top-level isolation selection; nested calls reject a specified isolation.
   * @returns A promise for the callback result after successful completion and cleanup.
   * @remarks Manual transaction-control SQL through the handle can defeat transaction integrity.
   */
  transaction<T>(
    callback: (tx: IQueryable) => Promise<T>,
    options?: ITransactionOptions,
  ): Promise<T>;
}
