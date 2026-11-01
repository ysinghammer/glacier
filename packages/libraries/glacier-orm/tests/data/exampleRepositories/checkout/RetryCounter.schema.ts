import { IsBigInt, IsInt, Rename } from "@glacier/schema";

/** Shared counter and the PostgreSQL transaction identifier that read it. */
export class RetryCounter {
  /** Value observed in the transaction's snapshot. */ public value!: number;
  /** Identifier of the active PostgreSQL transaction. */ public transactionId!: bigint;
}
IsInt()(RetryCounter.prototype, "value");
IsBigInt()(RetryCounter.prototype, "transactionId");
Rename("transaction_id")(RetryCounter.prototype, "transactionId");
