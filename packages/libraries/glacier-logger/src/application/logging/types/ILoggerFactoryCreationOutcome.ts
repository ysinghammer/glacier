import type { LoggerFactory } from "../Logger.factory.js";
import type { IRejectionReason } from "./IRejectionReason.js";

/** Either provides a configured factory or its validation rejection reasons.
 * @property outcome `created` when a factory is available; otherwise `rejected`.
 * @property factory Created factory; present only for the `created` variant.
 * @property reasons Validation failures; present only for the `rejected` variant.
 */
export type ILoggerFactoryCreationOutcome =
  | { readonly outcome: "created"; readonly factory: LoggerFactory }
  | { readonly outcome: "rejected"; readonly reasons: readonly IRejectionReason[] };
