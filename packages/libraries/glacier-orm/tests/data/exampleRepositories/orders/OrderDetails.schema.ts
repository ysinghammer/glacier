import { IsArray, IsBigInt, IsDate, IsString, Rename } from "@glacier/schema";
import { OrderLine } from "./OrderLine.schema.js";

/** Order and customer projection assembled in one PostgreSQL query. */
export class OrderDetails {
  /** Exact order identifier. */ public id!: bigint;
  /** Exact decimal amount as returned by PostgreSQL. */ public totalAmount!: string;
  /** Timestamp when the order was placed. */ public placedAt!: Date;
  /** Customer display name. */ public customerName!: string;
  /** Validated order lines in insertion order. */ public items!: OrderLine[];
}
IsBigInt()(OrderDetails.prototype, "id");
IsString()(OrderDetails.prototype, "totalAmount");
Rename("total_amount")(OrderDetails.prototype, "totalAmount");
IsDate()(OrderDetails.prototype, "placedAt");
Rename("placed_at")(OrderDetails.prototype, "placedAt");
IsString()(OrderDetails.prototype, "customerName");
Rename("customer_name")(OrderDetails.prototype, "customerName");
IsArray(OrderLine)(OrderDetails.prototype, "items");
