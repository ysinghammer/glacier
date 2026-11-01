import { expectTypeOf } from "vitest";
import { RowMapper, TableMapping } from "../../index.js";

/** A result schema class. */
class Result {
  /** Parsed numeric field. */
  public count!: number;
}
const rows: readonly unknown[] = [{ count: "1" }];
expectTypeOf(RowMapper.map(Result, rows)).toEqualTypeOf<Result[]>();
expectTypeOf(TableMapping.isTable(Result)).toEqualTypeOf<boolean>();
// @ts-expect-error The result target must be a schema class, not an instance.
RowMapper.map(new Result(), rows);
// @ts-expect-error Rows must be an array, not a single record.
RowMapper.map(Result, { count: "1" });
// @ts-expect-error Table inspection accepts a class, not an instance.
TableMapping.isTable(new Result());
