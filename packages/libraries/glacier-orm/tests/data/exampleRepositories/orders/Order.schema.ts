import { TableMapping } from "@glacier/orm";
import { IsBigInt, IsDate, IsInt, IsString, Optional } from "@glacier/schema";

/** A persisted purchase, with exact decimal total represented as text. */
export class Order {
  /** Generated bigint identifier. */ public id?: bigint;
  /** Customer placing the order. */ public userId!: number;
  /** Decimal total without floating-point conversion. */ public totalAmount!: string;
  /** Database-assigned order time. */ public placedAt?: Date;
}
TableMapping.table("orders")(Order);
IsBigInt()(Order.prototype, "id");
Optional()(Order.prototype, "id");
TableMapping.generated()(Order.prototype, "id");
IsInt()(Order.prototype, "userId");
IsString({ pattern: /^\d{1,10}(?:\.\d{1,2})?$/ })(Order.prototype, "totalAmount");
IsDate()(Order.prototype, "placedAt");
Optional()(Order.prototype, "placedAt");
TableMapping.dbDefault()(Order.prototype, "placedAt");
