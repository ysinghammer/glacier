import { expectTypeOf } from "vitest";
import { TableMapping, type ITableColumn, type ITableMapping } from "../../index.js";

expectTypeOf(TableMapping.table("users")).toEqualTypeOf<ClassDecorator>();
expectTypeOf(TableMapping.column("id")).toEqualTypeOf<PropertyDecorator>();
expectTypeOf(TableMapping.generated()).toEqualTypeOf<PropertyDecorator>();
expectTypeOf(TableMapping.dbDefault()).toEqualTypeOf<PropertyDecorator>();

/** A table with a runtime-generated and statically optional identifier. */
@TableMapping.table("users")
class User {
  /** Identifier may be omitted by insert callers. */
  @TableMapping.generated()
  public id?: string;
  /** Database defaults can also be represented as optional fields. */
  @TableMapping.dbDefault()
  public createdAt?: string;
  /** Name is required by the TypeScript model. */
  public name!: string;
}
const partial: User = { name: "Ada" };
const mapping: ITableMapping = TableMapping.read(User);
const column: ITableColumn | undefined = mapping.columns[0];
expectTypeOf(column?.isInsertOptional).toEqualTypeOf<boolean | undefined>();
// @ts-expect-error Readonly snapshots do not allow mutation.
mapping.columns.push({});
// @ts-expect-error Readonly lookup entries cannot be reassigned.
mapping.propertyToColumn.name = "other";
// @ts-expect-error Metadata inspection accepts classes, not instances.
TableMapping.read(partial);
// @ts-expect-error Database identifiers are strings.
TableMapping.column(1);
