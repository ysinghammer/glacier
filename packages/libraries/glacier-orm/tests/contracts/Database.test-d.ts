import { expectTypeOf } from "vitest";
import { DbFactory, Sql } from "../../index.js";
import type {
  Database,
  IDbOptions,
  IExecutionResult,
  IQueryable,
  IQueryEvent,
} from "../../index.js";

/** A typed query projection. */
class Result {
  /** Integer field. */
  public count!: number;
}
const options: IDbOptions = {
  onQuery: (event: IQueryEvent) => {
    expectTypeOf(event.rowCount).toEqualTypeOf<IExecutionResult>();
  },
};
const database = DbFactory.create(options);
const queryable: IQueryable = database;
const fragment = Sql.tag`select 1 as count`;
expectTypeOf(database).toEqualTypeOf<Database>();
expectTypeOf(queryable.query(Result, fragment)).toEqualTypeOf<Promise<Result[]>>();
expectTypeOf(queryable.many(Result, fragment)).toEqualTypeOf<Promise<Result[]>>();
expectTypeOf(queryable.one(Result, fragment)).toEqualTypeOf<Promise<Result>>();
expectTypeOf(queryable.maybeOne(Result, fragment)).toEqualTypeOf<Promise<Result | undefined>>();
expectTypeOf(queryable.execute(fragment)).toEqualTypeOf<
  Promise<number | null | readonly (number | null)[]>
>();
expectTypeOf(database.close()).toEqualTypeOf<Promise<void>>();
// @ts-expect-error Result targets must be schema classes.
queryable.query(new Result(), fragment);
// @ts-expect-error Statements must be SQL fragments.
queryable.execute("select 1");
