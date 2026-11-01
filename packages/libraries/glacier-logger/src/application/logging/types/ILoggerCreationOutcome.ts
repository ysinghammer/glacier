import type { Logger } from "../Logger.js";
import type { IRejectionReason } from "./IRejectionReason.js";

/** Either provides a context logger or all validation reasons that prevented its creation.
 * @property outcome `created` when a logger is available; otherwise `rejected`.
 * @property logger Created logger; present only for the `created` variant.
 * @property reasons Validation failures; present only for the `rejected` variant.
 */
export type ILoggerCreationOutcome =
  | { readonly outcome: "created"; readonly logger: Logger }
  | { readonly outcome: "rejected"; readonly reasons: readonly IRejectionReason[] };
