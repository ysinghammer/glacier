import type { ITableColumn } from "./ITableColumn.js";

/** Immutable effective table mapping in schema declaration order. */
export interface ITableMapping {
  /** Explicit table name before SQL identifier quoting. */
  readonly table: string;
  /** Frozen field mappings, including inherited fields. */
  readonly columns: readonly ITableColumn[];
  /** Frozen null-prototype lookup from logical properties to column names; absent keys yield undefined. */
  readonly propertyToColumn: Readonly<Record<string, string>>;
  /** Frozen null-prototype lookup from column names to logical properties; absent keys yield undefined. */
  readonly columnToProperty: Readonly<Record<string, string>>;
  /** Frozen property names marked generated or database-defaulted, in field order. */
  readonly insertOptionalProperties: readonly string[];
}
