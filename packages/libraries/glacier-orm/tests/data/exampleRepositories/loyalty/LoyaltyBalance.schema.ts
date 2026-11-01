import { IsInt } from "@glacier/schema";

/** Loyalty balance returned by a query. */
export class LoyaltyBalance {
  /** Current points. */ public points!: number;
}
IsInt()(LoyaltyBalance.prototype, "points");
