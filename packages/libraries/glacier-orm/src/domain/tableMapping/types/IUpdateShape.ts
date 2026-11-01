/**
 * Static update shape making every instance member optional while preserving readonly modifiers.
 * This type does not enforce a nonempty update or validate table metadata.
 * @template T The table instance type whose properties may be supplied for an update.
 */
export type IUpdateShape<T extends object> = Partial<T>;
