/**
 * Represents a parsed sort specification.
 */
export interface SortSpecification {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Parses and validates sort specifications from query parameters.
 *
 * Supports JSON:API sort syntax:
 * - "field" → ascending by field
 * - "-field" → descending by field
 * - "field1,-field2" → multiple fields (takes first one only)
 *
 * Used to centralize sort string parsing and field validation.
 */
export class SortParser {
  /**
   * List of allowed sortable fields for User queries.
   */
  private static readonly ALLOWED_FIELDS = [
    'createdAt',
    'updatedAt',
    'email',
    'firstName',
    'lastName'
  ];

  /**
   * Parses a JSON:API sort string into a typed SortSpecification.
   *
   * @param sortString - The raw sort string (e.g., "-createdAt,email").
   * @returns A SortSpecification with validated field and direction, or undefined if invalid.
   */
  public static parse(sortString?: string): SortSpecification | undefined {
    if (!sortString || typeof sortString !== 'string') return undefined;

    // Take the first field from comma-separated list
    const firstField = sortString.split(',')[0]?.trim();
    if (!firstField) return undefined;

    const isDescending = firstField.startsWith('-');
    const field = isDescending ? firstField.substring(1) : firstField;

    // Validate field is in allowed list
    if (!SortParser.isAllowedField(field)) {
      return undefined;
    }

    return {
      field,
      direction: isDescending ? 'desc' : 'asc'
    };
  }

  /**
   * Validates that a field name is sortable.
   *
   * @param field - The field name to validate.
   * @returns true if the field is in the allowed list.
   */
  public static isAllowedField(field: string): boolean {
    return SortParser.ALLOWED_FIELDS.includes(field);
  }

  /**
   * Returns the list of allowed sortable fields.
   *
   * @returns Array of allowed field names.
   */
  public static allowedFields(): string[] {
    return [...SortParser.ALLOWED_FIELDS];
  }
}
