/**
 * Loyalty processing result, including a rejected award after savepoint rollback.
 * @property outcome Distinguishes an awarded balance from a rejected award.
 */
export type ILoyaltyOutcome =
  | { readonly outcome: "awarded" }
  | { readonly outcome: "limit_reached" };
