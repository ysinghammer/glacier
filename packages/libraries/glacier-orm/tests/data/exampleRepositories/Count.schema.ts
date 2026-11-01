import { IsInt } from "@glacier/schema";

/** Count returned by an aggregate query. */
export class Count {
  /** Number of persisted rows. */ public count!: number;
}
IsInt()(Count.prototype, "count");
