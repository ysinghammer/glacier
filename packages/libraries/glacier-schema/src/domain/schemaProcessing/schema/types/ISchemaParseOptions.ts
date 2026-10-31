/** Per-call options of `parse` and `safeParse`; there is no field-level or class-level equivalent. */
export interface ISchemaParseOptions {
  /**
   * Promote present scalars to declared arrays, independently of scalar coercion; never objects/null.
   * @default false
   */
  readonly coerceSingletonArrays?: boolean;
  /**
   * Converts supported scalar input toward the declared type before validation; unconvertible values remain
   * unchanged for validation. Includes numeric, boolean, bigint, date and string conversions.
   * @default false
   */
  readonly coerce?: boolean;
  /**
   * Maximum nested class levels, including the root, before parsing reports `max_depth_exceeded`.
   * @default 64
   */
  readonly maxDepth?: number;
}
