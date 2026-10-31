import type { LoggerFactory } from "./Logger.factory.js";
import type { IRejectionReason } from "./IRejectionReason.js";

/** Result of `LoggerFactory.create`. */
export type ILoggerFactoryCreationOutcome =
  | { readonly outcome: "created"; readonly factory: LoggerFactory }
  | { readonly outcome: "rejected"; readonly reasons: readonly IRejectionReason[] };
