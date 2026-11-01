/** Optional isolation level for a top-level transaction. */
export interface ITransactionOptions {
  /** PostgreSQL isolation level; omitted uses the server default. Nested transactions reject it. */
  readonly isolation?: "read committed" | "repeatable read" | "serializable";
}
