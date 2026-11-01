import { CheckViolation, Sql } from "@glacier/orm";
import type { IQueryable } from "@glacier/orm";
import type { ILoyaltyOutcome } from "./ILoyaltyOutcome.js";

/** Awards points in a savepoint, reporting the example loyalty cap as a typed rejection. */
export class LoyaltyRepository {
  /**
   * Holds the caller-owned query interface.
   * @param db Transaction in which the award savepoint runs.
   */
  public constructor(private readonly db: IQueryable) {}

  /**
   * Records an award and updates the balance atomically within a savepoint.
   * @param userId Customer receiving points.
   * @param points Number of points to award.
   * @returns A promise for the award outcome after savepoint cleanup.
   * @throws {Error} If an unexpected failure is rethrown or wrapped.
   */
  public async award(userId: number, points: number): Promise<ILoyaltyOutcome> {
    try {
      await this.db.transaction(async (nested) => {
        await nested.execute(
          Sql.tag`insert into loyalty_events (user_id, points) values (${userId}, ${points})`,
        );
        const updated = await nested.execute(
          Sql.tag`update loyalty set points = points + ${points} where user_id = ${userId}`,
        );
        if (updated !== 1) throw new Error("Customer has no loyalty account");
      });
      return { outcome: "awarded" };
    } catch (error: unknown) {
      if (error instanceof CheckViolation && error.constraint === "loyalty_points_limit") {
        return { outcome: "limit_reached" };
      }
      if (error instanceof Error) throw error;
      throw new Error("Loyalty award failed", { cause: error });
    }
  }
}
