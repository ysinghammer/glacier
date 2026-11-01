import { Sql } from "@glacier/orm";
import type { IQueryable } from "@glacier/orm";
import type { IResult } from "@glacier/schema";
import { MonthlyRevenue } from "./MonthlyRevenue.schema.js";
import { Order } from "./Order.schema.js";
import { OrderDetails } from "./OrderDetails.schema.js";
import { OrderItem } from "./OrderItem.schema.js";

/** Purchase repository whose operations can share a transaction. */
export class OrderRepository {
  /**
   * Holds the caller-owned query interface.
   * @param db Database or callback-scoped transaction handle.
   */
  public constructor(private readonly db: IQueryable) {}

  /**
   * Inserts a validated order.
   * @param input Logical order fields.
   * @returns A promise for the inserted order or validation issues.
   */
  public async insert(input: Order): Promise<IResult<Order>> {
    const write = Sql.values(Order, input);
    if (!write.ok) return write;
    return {
      ok: true,
      value: await this.db.one(Order, Sql.tag`insert into orders ${write.value} returning *`),
    };
  }

  /**
   * Inserts validated order lines as a single statement.
   * @param lines Logical line fields including their parent order.
   * @returns A promise for the inserted lines or validation issues.
   */
  public async insertItems(lines: readonly OrderItem[]): Promise<IResult<OrderItem[]>> {
    const write = Sql.values(OrderItem, lines);
    if (!write.ok) return write;
    return {
      ok: true,
      value: await this.db.many(
        OrderItem,
        Sql.tag`insert into order_items ${write.value} returning *`,
      ),
    };
  }

  /**
   * Projects an order and nested lines, including orders without lines.
   * @param id Order identifier.
   * @returns A promise for the validated projection, or undefined when absent.
   */
  public findDetails(id: bigint): Promise<OrderDetails | undefined> {
    return this.db.maybeOne(
      OrderDetails,
      Sql.tag`
      select o.id, o.total_amount, o.placed_at, u.display_name as customer_name,
        coalesce(json_agg(json_build_object('id', i.id::text, 'sku', i.sku, 'quantity', i.quantity::text)
          order by i.id) filter (where i.id is not null), '[]'::json) as items
      from orders o join users u on u.id = o.user_id
      left join order_items i on i.order_id = o.id
      where o.id = ${id} group by o.id, u.display_name
    `,
    );
  }

  /**
   * Groups one customer's orders by UTC month from an inclusive instant.
   * @param userId Customer whose orders contribute to the report.
   * @param since Inclusive timestamp boundary.
   * @returns A promise for chronological monthly totals with exact decimal sums.
   */
  public monthlyRevenue(userId: number, since: Date): Promise<MonthlyRevenue[]> {
    return this.db.many(
      MonthlyRevenue,
      Sql.tag`
      with monthly as (
        select date_trunc('month', placed_at, 'UTC') as month, total_amount
        from orders where user_id = ${userId} and placed_at >= ${since}
      )
      select month, sum(total_amount)::text as revenue, count(*)::int as order_count
      from monthly group by month order by month
    `,
    );
  }
}
