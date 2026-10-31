import type { Logger } from "./Logger.js";
import type { IRejectionReason } from "./IRejectionReason.js";

/** Result of `LoggerFactory.createLogger`. */
export type ILoggerCreationOutcome =
  | { readonly outcome: "created"; readonly logger: Logger }
  | { readonly outcome: "rejected"; readonly reasons: readonly IRejectionReason[] };
