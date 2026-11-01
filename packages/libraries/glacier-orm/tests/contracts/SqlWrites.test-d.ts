import { Sql, SqlFragment } from "../../index.js";
import type { IResult } from "@glacier/schema";

/** Table contract demonstrating static required and optional fields. */
class User {
  /** Caller-supplied required name. */
  public name!: string;
  /** Database-generated optional identifier. */
  public id?: number;
}

const row = { name: "Ada" };
const rows: readonly User[] = [row];
const inserted: IResult<SqlFragment> = Sql.values(User, row);
const insertedMany: IResult<SqlFragment> = Sql.values(User, rows);
const updated: IResult<SqlFragment> = Sql.set(User, { id: 2 });
if (inserted.ok) {
  const fragment: SqlFragment = inserted.value;
  void fragment;
} else {
  const issues = inserted.issues;
  void issues;
  // @ts-expect-error A failed write has no interpolatable fragment.
  void inserted.value;
}
// @ts-expect-error Insert rows must include required fields.
Sql.values(User, {});
// @ts-expect-error Every insert row must satisfy the table instance type.
Sql.values(User, [{ name: "Ada" }, { id: 1 }]);
// @ts-expect-error Patch properties retain their declared types.
Sql.set(User, { name: 1 });
// @ts-expect-error Undeclared patch properties are not accepted.
Sql.set(User, { unknown: true });
void [insertedMany, updated];
