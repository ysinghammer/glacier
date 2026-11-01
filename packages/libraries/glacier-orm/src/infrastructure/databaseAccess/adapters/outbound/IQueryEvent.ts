import type { IExecutionResult } from "../../../../application/databaseAccess/types/IExecutionResult.js";

/** Query execution diagnostics; neither bound values nor raw database errors are included. */
export interface IQueryEvent {
  /** Compiled SQL text; caller-supplied SQL literals may themselves be sensitive. */
  readonly text: string;
  /** Elapsed query time in milliseconds. */
  readonly durationMs: number;
  /** One or ordered multiple PostgreSQL counts; null also indicates execution failure. */
  readonly rowCount: IExecutionResult;
  /** Secret-safe failure summary, or undefined on successful execution. */
  readonly error: Error | undefined;
}
