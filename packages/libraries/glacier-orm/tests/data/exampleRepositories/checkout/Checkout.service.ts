import { Sql } from "@glacier/orm";
import type { IQueryable } from "@glacier/orm";
import type { IResult } from "@glacier/schema";
import { LoyaltyRepository } from "../loyalty/Loyalty.repository.js";
import { OrderRepository } from "../orders/Order.repository.js";
import { Order } from "../orders/Order.schema.js";
import { OrderItem } from "../orders/OrderItem.schema.js";
import type { ICheckoutReceipt } from "./ICheckoutReceipt.js";

/** Checkout coordinates a customer lock and order writes atomically. */
export class CheckoutService {
  /**
   * Holds the caller-owned database interface.
   * @param db Database or callback-scoped transaction handle.
   */
  public constructor(private readonly db: IQueryable) {}

  /**
   * Validates input before writing, then commits the order and all lines together.
   * @param userId Customer identifier.
   * @param totalAmount Caller-supplied nonnegative decimal with at most two fractional digits.
   * @param lines Requested line data.
   * @returns A promise for the committed order and loyalty outcome, or validation issues.
   */
  public async checkout(
    userId: number,
    totalAmount: string,
    lines: readonly { sku: string; quantity: number }[],
  ): Promise<IResult<ICheckoutReceipt>> {
    const orderInput = { userId, totalAmount };
    const orderValidation = Sql.values(Order, orderInput);
    if (!orderValidation.ok) return orderValidation;
    const lineValidation = Sql.values(
      OrderItem,
      lines.map((line) => ({ ...line, orderId: 0n })),
    );
    if (!lineValidation.ok) return lineValidation;
    return this.db.transaction(
      async (tx) => {
        await tx.execute(Sql.tag`select 1 from users where id = ${userId} for update`);
        const orders = new OrderRepository(tx);
        const order = await orders.insert(orderInput);
        if (!order.ok || order.value.id === undefined)
          throw new Error("Validated order could not be inserted");
        const orderId = order.value.id;
        const items = await orders.insertItems(lines.map((line) => ({ ...line, orderId })));
        if (!items.ok) throw new Error("Validated order lines could not be inserted");
        const loyalty = await new LoyaltyRepository(tx).award(userId, lines.length);
        const details = await orders.findDetails(orderId);
        if (details === undefined) throw new Error("Inserted order was not found");
        return { ok: true, value: { order: details, loyalty } };
      },
      { isolation: "serializable" },
    );
  }
}
