import { IsDate, IsInt, IsString, Rename } from "@glacier/schema";

/** Monthly order totals, kept exact as decimal text. */
export class MonthlyRevenue {
  /** First instant of the month in UTC. */ public month!: Date;
  /** Sum of order totals as decimal text. */ public revenue!: string;
  /** Number of orders in the month. */ public orderCount!: number;
}
IsDate()(MonthlyRevenue.prototype, "month");
IsString()(MonthlyRevenue.prototype, "revenue");
IsInt()(MonthlyRevenue.prototype, "orderCount");
Rename("order_count")(MonthlyRevenue.prototype, "orderCount");
