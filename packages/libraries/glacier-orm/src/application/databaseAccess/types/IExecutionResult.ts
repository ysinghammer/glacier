/** A single PostgreSQL row count, or ordered counts for a multi-statement result; null means unavailable. */
export type IExecutionResult = number | null | readonly (number | null)[];
