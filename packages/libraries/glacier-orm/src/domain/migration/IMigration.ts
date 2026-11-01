/** One discovered, immutable SQL migration and its SHA-256 identity. */
export interface IMigration {
  /** One-based four-digit ordering number. */
  readonly sequence: number;
  /** Validated migration filename. */
  readonly name: string;
  /** Lowercase SHA-256 of the original file bytes. */
  readonly checksum: string;
  /** UTF-8 SQL executed by PostgreSQL. */
  readonly sql: string;
  /** Whether SQL and its history record are committed together. */
  readonly isTransactional: boolean;
}
