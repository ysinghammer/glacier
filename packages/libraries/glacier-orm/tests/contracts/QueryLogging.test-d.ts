import { expectTypeOf } from "vitest";
import type { Logger } from "@glacier/logger";
import { DbFactory, QueryLogHook } from "../../index.js";
import type { IQueryEvent, IQueryLogHookOptions, IQueryLogHookOutcome } from "../../index.js";

declare const logger: Logger;
const options: IQueryLogHookOptions = { slowQueryMs: 100 };
const result = QueryLogHook.create(logger, options);
expectTypeOf(result).toEqualTypeOf<IQueryLogHookOutcome>();
if (result.outcome === "created") {
  expectTypeOf(result.hook).toEqualTypeOf<(event: IQueryEvent) => void>();
  DbFactory.create({ onQuery: result.hook });
} else {
  expectTypeOf(result.reason).toEqualTypeOf<"invalid_logger" | "invalid_slow_query_ms">();
  // @ts-expect-error Rejected outcomes do not carry a hook.
  result.hook;
}
// @ts-expect-error The threshold is required.
QueryLogHook.create(logger, {});
// @ts-expect-error A Glacier logger is required.
QueryLogHook.create({}, options);
