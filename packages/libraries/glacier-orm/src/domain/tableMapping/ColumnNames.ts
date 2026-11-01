/** Converts logical property names to default PostgreSQL column identifiers. */
export class ColumnNames {
  /**
   * Separates ASCII camel-case and acronym boundaries and lowercases the result.
   * @param property Logical schema property name.
   * @returns Snake-case column name without SQL quoting.
   */
  public static snakeCase(property: string): string {
    return property
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .toLowerCase();
  }
}
