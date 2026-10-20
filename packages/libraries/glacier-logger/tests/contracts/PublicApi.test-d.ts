import { LoggerFactory } from "../../index.js";
import type { ILogCall, ILoggerConfiguration, Logger } from "../../index.js";

declare const factory: LoggerFactory;
declare const logger: Logger;
declare const configuration: ILoggerConfiguration;

// LOG-013: the factory cannot log.
// @ts-expect-error LoggerFactory has no log methods
factory.info({ message: "x" });
// @ts-expect-error LoggerFactory has no log methods
factory.debug({ message: "x" });

// LOG-013: bare strings are compile errors.
// @ts-expect-error a call is an object, not a string
logger.info("text");

// LOG-015: reserved keys are compile errors.
// @ts-expect-error `level` is reserved
logger.info({ message: "x", level: "info" });
// @ts-expect-error `time` is reserved
logger.info({ message: "x", time: new Date() });
// @ts-expect-error `context` is reserved
logger.info({ message: "x", context: "c" });
// @ts-expect-error `err` must be an Error
logger.info({ message: "x", err: "not an error" });
// @ts-expect-error a call needs a message or an error
logger.info({ userId: 1 });
// @ts-expect-error reserved binding keys are compile errors for child
logger.child({ level: "info" });

// LOG-015: valid shapes compile.
logger.info({ message: "x", userId: 1 });
logger.error({ err: new Error("boom") });
logger.error({ err: new Error("boom"), message: "failed", attempt: 2 });
logger.child({ requestId: "r1" });
const call: ILogCall = { message: "ok" };
logger.warn(call);

// LOG-010 and LOG-011: both creation styles are part of the public API.
export const created = LoggerFactory.create(configuration);
export const constructed: LoggerFactory = new LoggerFactory(configuration);
