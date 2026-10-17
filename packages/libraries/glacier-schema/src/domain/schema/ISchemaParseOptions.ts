/** Per-call options of `parse` and `safeParse`; there is no field-level or class-level equivalent. */
export interface ISchemaParseOptions {
  /**
   * Converts string, number and similar input into the declared type before validation: numeric strings to
   * numbers, `"true"`/`"false"` to booleans, integer strings to bigints, ISO 8601 strings and numeric
   * timestamps to dates, and numbers/booleans to strings. Values that cannot be converted are left for
   * validation to reject. Off by default.
   */
  readonly coerce?: boolean;
  /**
   * Largest number of nested class levels, the root class included, before parsing reports
   * `max_depth_exceeded` instead of descending further. Defaults to 64; use a positive integer.
   */
  readonly maxDepth?: number;
}
