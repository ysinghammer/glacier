/** Quotes PostgreSQL identifiers without interpreting dots or SQL syntax. */
export class SqlIdentifiers {
  /**
   * Quotes one complete identifier, escaping embedded double quotes.
   * @param name Identifier to quote as one SQL name.
   * @returns SQL-quoted identifier.
   */
  public static quote(name: string): string {
    return `"${name.replaceAll('"', '""')}"`;
  }
}
