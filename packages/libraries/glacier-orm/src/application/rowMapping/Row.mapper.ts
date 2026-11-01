import type { IConstructableClass } from "@glacier/reflection";
import { Schema } from "@glacier/schema";
import { RowValidationError } from "../../domain/errorHandling/errors/RowValidation.error.js";
import { TableMapping } from "../tableMapping/TableMapping.js";
import type { ITableColumn } from "../../domain/tableMapping/types/ITableColumn.js";

/** Validates PostgreSQL result rows against schema classes, including declared table mappings. */
export class RowMapper {
  /**
   * Maps rows in order to validated, constructor-free schema instances.
   * @template T Instance type represented by the result class.
   * @param target Schema result class; table declarations select database-column mapping.
   * @param rows Untrusted PostgreSQL result rows, in result order.
   * @returns A new array of parsed instances; input rows are not mutated.
   * @remarks Schema coercion applies recursively; non-table rows use schema wire names directly.
   * @remarks Table mappings are prepared even for empty results; unrecognized columns are ignored.
   * @remarks Row validation failures carry the zero-based index in a `RowValidationError`.
   */
  public static map<T extends object>(
    target: IConstructableClass<T>,
    rows: readonly unknown[],
  ): T[] {
    const columns = TableMapping.isTable(target) ? TableMapping.read(target).columns : undefined;
    return Array.from(rows, (row, index) => RowMapper.parse(target, row, index, columns));
  }

  /**
   * Parses a single row and translates schema validation failures without concealing other errors.
   * @template T Instance type represented by the result class.
   * @param target Result schema class.
   * @param row Untrusted row to validate.
   * @param index Zero-based result position.
   * @param columns Effective table columns, or undefined for a non-table result.
   * @returns Validated schema instance.
   * @remarks Other thrown values propagate unchanged.
   * @throws {RowValidationError} If schema validation reports issues for the row.
   */
  private static parse<T extends object>(
    target: IConstructableClass<T>,
    row: unknown,
    index: number,
    columns: readonly ITableColumn[] | undefined,
  ): T {
    const input = columns === undefined ? row : RowMapper.tableInput(row, columns);
    try {
      return Schema.parse(target, input, { coerce: true });
    } catch (error: unknown) {
      if (!Schema.isError(error)) throw error;
      throw new RowValidationError(index, error.issues, { cause: error });
    }
  }

  /**
   * Copies present table columns to their schema wire names without accepting other aliases.
   * @param row Untrusted row; invalid non-plain values are left for schema validation.
   * @param columns Effective column-to-wire mappings.
   * @returns A detached wire-name record, or the original invalid-shaped row.
   */
  private static tableInput(row: unknown, columns: readonly ITableColumn[]): unknown {
    if (typeof row !== "object" || row === null) return row;
    const prototype: unknown = Object.getPrototypeOf(row);
    if (prototype !== Object.prototype && prototype !== null) return row;
    const input: Record<string, unknown> = Object.create(null);
    for (const column of columns) {
      if (Object.hasOwn(row, column.column)) {
        input[column.wireName] = Reflect.get(row, column.column);
      }
    }
    return input;
  }
}
