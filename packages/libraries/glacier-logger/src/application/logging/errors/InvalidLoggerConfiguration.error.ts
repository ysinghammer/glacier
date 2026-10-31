import type { IRejectionReason } from "../types/IRejectionReason.js";

/** Carries every validation reason for an invalid logger factory configuration. */
export class InvalidLoggerConfigurationError extends Error {
  /** All configuration failures reported by validation. */
  public readonly reasons: readonly IRejectionReason[];

  /** Creates an error whose message summarizes every supplied reason.
   * @param reasons Configuration validation failures to retain.
   */
  constructor(reasons: readonly IRejectionReason[]) {
    super(`Invalid logger configuration: ${reasons.map((reason) => reason.message).join("; ")}`);
    this.name = "InvalidLoggerConfigurationError";
    this.reasons = reasons;
  }
}
