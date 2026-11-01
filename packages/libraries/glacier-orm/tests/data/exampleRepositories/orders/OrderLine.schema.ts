import { IsBigInt, IsInt, IsString } from "@glacier/schema";

/** Nested JSON line projected by PostgreSQL. */
export class OrderLine {
  /** Exact bigint line identifier encoded as JSON text. */ public id!: bigint;
  /** Stock-keeping unit. */ public sku!: string;
  /** Quantity encoded as JSON text. */ public quantity!: number;
}
IsBigInt()(OrderLine.prototype, "id");
IsString()(OrderLine.prototype, "sku");
IsInt()(OrderLine.prototype, "quantity");
