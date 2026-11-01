import type { OrderDetails } from "../orders/OrderDetails.schema.js";
import type { ILoyaltyOutcome } from "../loyalty/ILoyaltyOutcome.js";

/** Committed checkout details and the separately reported loyalty outcome. */
export interface ICheckoutReceipt {
  /** Committed order and its lines. */
  readonly order: OrderDetails;
  /** Award result; a limit rejection does not undo the order. */
  readonly loyalty: ILoyaltyOutcome;
}
