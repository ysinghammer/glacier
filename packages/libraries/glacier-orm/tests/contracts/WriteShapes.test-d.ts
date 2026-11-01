import { expectTypeOf } from "vitest";
import { TableMapping } from "@glacier/orm";
import type { IInsertShape, IUpdateShape } from "@glacier/orm";

/** Table instance with explicitly optional generated and database-defaulted fields. */
@TableMapping.table("accounts")
class Account {
  /** Generated identifier may be omitted on insert. */
  @TableMapping.generated()
  public readonly id?: number;

  /** Database default may be omitted on insert. */
  @TableMapping.dbDefault()
  public createdAt?: Date;

  /** Required name remains required on insert. */
  public name!: string;

  /** Readonly category remains required on insert. */
  public readonly category!: string;
}

const insert: IInsertShape<Account> = { name: "Ada", category: "person" };
const fullInsert: IInsertShape<Account> = {
  id: 1,
  createdAt: new Date(),
  name: "Ada",
  category: "person",
};
const update: IUpdateShape<Account> = { name: "Grace" };
const emptyUpdate: IUpdateShape<Account> = {};
expectTypeOf<IInsertShape<Account>>().toEqualTypeOf<Account>();
expectTypeOf<IUpdateShape<Account>>().toEqualTypeOf<Partial<Account>>();
expectTypeOf(insert.id).toEqualTypeOf<number | undefined>();
expectTypeOf(insert.createdAt).toEqualTypeOf<Date | undefined>();
expectTypeOf(update.name).toEqualTypeOf<string | undefined>();

// @ts-expect-error Required fields remain required, independently of generated fields.
const missingName: IInsertShape<Account> = { category: "person" };
// @ts-expect-error A generated field retains its declared value type.
const wrongGenerated: IInsertShape<Account> = { name: "Ada", category: "person", id: "1" };
// @ts-expect-error Updates retain the declared value types.
const wrongUpdate: IUpdateShape<Account> = { name: 1 };
// @ts-expect-error Exact optional properties do not accept explicit undefined here.
const undefinedDefault: IInsertShape<Account> = {
  name: "Ada",
  category: "person",
  createdAt: undefined,
};
// @ts-expect-error Readonly modifiers survive the insert shape.
insert.category = "company";
// @ts-expect-error Readonly modifiers survive the partial update shape.
update.id = 1;

/** Runtime decorators cannot make a statically required field optional. */
class RequiredGenerated {
  /** Despite the decorator this declaration is required in TypeScript. */
  @TableMapping.generated()
  public id!: number;
}

// @ts-expect-error A decorator does not change the required TypeScript property.
const missingGenerated: IInsertShape<RequiredGenerated> = {};
void [
  fullInsert,
  emptyUpdate,
  missingName,
  wrongGenerated,
  wrongUpdate,
  undefinedDefault,
  missingGenerated,
];
