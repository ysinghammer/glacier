import { TableMapping } from "@glacier/orm";
import { IsDate, IsInt, IsString, Nullable, Optional } from "@glacier/schema";

/** A customer persisted with PostgreSQL-owned defaults. */
export class User {
  /** Generated customer identifier. */ public id?: number;
  /** Unique email address. */ public email!: string;
  /** Customer's display name. */ public displayName!: string;
  /** Database-assigned account state. */ public status?: string;
  /** Database-assigned creation time. */ public createdAt?: Date;
  /** Soft-deletion time, or null while active. */ public deletedAt?: Date | null;
}
TableMapping.table("users")(User);
IsInt()(User.prototype, "id");
Optional()(User.prototype, "id");
TableMapping.generated()(User.prototype, "id");
IsString({ min: 1 })(User.prototype, "email");
IsString({ min: 1, trim: true })(User.prototype, "displayName");
IsString()(User.prototype, "status");
Optional()(User.prototype, "status");
TableMapping.dbDefault()(User.prototype, "status");
IsDate()(User.prototype, "createdAt");
Optional()(User.prototype, "createdAt");
TableMapping.column("created")(User.prototype, "createdAt");
TableMapping.dbDefault()(User.prototype, "createdAt");
IsDate()(User.prototype, "deletedAt");
Nullable()(User.prototype, "deletedAt");
Optional()(User.prototype, "deletedAt");
TableMapping.dbDefault()(User.prototype, "deletedAt");
