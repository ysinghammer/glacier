import { TableMapping } from "@glacier/orm";
import { IsString, Optional, Rename } from "@glacier/schema";

/** Real compiled legacy-decorator consumer using only public package roots. */
@TableMapping.table("users")
class DecoratedUser {
  /** Database-generated identifier that is optional to TypeScript callers. */
  @IsString()
  @Optional()
  @TableMapping.generated()
  public id?: string;

  /** Different schema wire and explicit database names. */
  @IsString()
  @Rename("wire_name")
  @TableMapping.column("db_name")
  public name!: string;
}

const mapping = TableMapping.read(DecoratedUser);
console.log(
  JSON.stringify({
    table: mapping.table,
    column: mapping.propertyToColumn.name,
    wire: mapping.columns[1]?.wireName,
    optional: mapping.insertOptionalProperties,
  }),
);
