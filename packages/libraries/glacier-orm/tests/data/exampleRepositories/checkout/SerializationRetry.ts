import { SerializationFailure } from "@glacier/orm";
import type { Database, IQueryable } from "@glacier/orm";

/** Caller-owned bounded retries, each using a fresh top-level serializable transaction. */
export class SerializationRetry {
  /**
   * Reruns only serialization failures after the failed transaction has finished cleanup.
   * @template T Successful callback result.
   * @param db Database that creates each independent transaction.
   * @param maxAttempts Positive safe integer including the initial attempt.
   * @param work Awaited transaction work, receiving its one-based attempt number.
   * @returns A promise for the committed callback result.
   * @throws {RangeError} Rejects if the limit is not a positive safe integer.
   * @throws {Error} Rejects when attempts are exhausted or another failure is rethrown or wrapped.
   * @remarks The callback must be safe to repeat and must not perform irreversible side effects.
   */
  public static async run<T>(
    db: Database,
    maxAttempts: number,
    work: (tx: IQueryable, attempt: number) => Promise<T>,
  ): Promise<T> {
    if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
      throw new RangeError("Attempt limit must be a positive safe integer");
    }
    for (let attempt = 1; ; attempt++) {
      try {
        return await db.transaction((tx) => work(tx, attempt), { isolation: "serializable" });
      } catch (error: unknown) {
        if (error instanceof SerializationFailure && attempt < maxAttempts) continue;
        if (error instanceof Error) throw error;
        throw new Error("Transaction retry failed", { cause: error });
      }
    }
  }
}
