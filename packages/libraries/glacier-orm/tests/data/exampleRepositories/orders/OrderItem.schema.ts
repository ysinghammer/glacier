import { TableMapping } from "@glacier/orm";
import { IsBigInt, IsInt, IsString, Optional } from "@glacier/schema";

/** A persisted line belonging to an order. */
export class OrderItem {
  /** Generated bigint identifier. */ public id?: bigint;
  /** Parent order identifier. */ public orderId!: bigint;
  /** Stock-keeping unit. */ public sku!: string;
  /** Quantity; PostgreSQL enforces positivity. */ public quantity!: number;
}
TableMapping.table("order_items")(OrderItem);
IsBigInt()(OrderItem.prototype, "id");
Optional()(OrderItem.prototype, "id");
TableMapping.generated()(OrderItem.prototype, "id");
IsBigInt()(OrderItem.prototype, "orderId");
IsString({ min: 1 })(OrderItem.prototype, "sku");
IsInt()(OrderItem.prototype, "quantity");
