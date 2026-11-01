import type { IQueryEvent } from "./IQueryEvent.js";

/** Creation result: a database observer on success, or a secret-free input rejection code.
 * @property outcome Discriminant: created or rejected.
 * @property hook Observer on success; invalid manually supplied durations throw TypeError.
 * @property reason Rejection code for an invalid logger or threshold.
 */
export type IQueryLogHookOutcome =
  | { readonly outcome: "created"; readonly hook: (event: IQueryEvent) => void }
  | { readonly outcome: "rejected"; readonly reason: "invalid_logger" | "invalid_slow_query_ms" };
