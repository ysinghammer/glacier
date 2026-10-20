import { LoggerFactory } from "../../index.js";
import {
  JsonEntryFormatter,
  NodeFileTransport,
  NodeStdoutTransport,
  PrettyEntryFormatter,
} from "../../index.js";
import { BrowserConsoleTransport } from "../../index.browser.js";
import type {
  IEntryFormatter,
  ILogCall,
  IStyledOutput,
  ILoggerConfiguration,
  ITransport,
  Logger,
} from "../../index.js";

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

// Formatting: both formatters implement the entry formatter contract.
export const jsonFormatter: IEntryFormatter = new JsonEntryFormatter();
export const prettyFormatter: IEntryFormatter = new PrettyEntryFormatter({ isColorEnabled: true });
export declare const styled: IStyledOutput;
// @ts-expect-error colour must be decided explicitly
new PrettyEntryFormatter({});

// Transports: every shipped transport implements the transport contract.
export const stdoutTransport: ITransport = new NodeStdoutTransport();
export const fileTransport: ITransport = new NodeFileTransport({ path: "logs/app.log" });
export const consoleTransport: ITransport = new BrowserConsoleTransport();
// @ts-expect-error a file transport needs a path
new NodeFileTransport({});
