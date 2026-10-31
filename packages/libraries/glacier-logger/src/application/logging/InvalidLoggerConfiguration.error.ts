import type { IRejectionReason } from "./IRejectionReason.js";

/** Thrown by `new LoggerFactory(config)` when the configuration is invalid. */
export class InvalidLoggerConfigurationError extends Error {
  readonly reasons: readonly IRejectionReason[];

  /** Keeps every rejection reason; the message joins them for humans. */
  constructor(reasons: readonly IRejectionReason[]) {
    super(`Invalid logger configuration: ${reasons.map((reason) => reason.message).join("; ")}`);
    this.name = "InvalidLoggerConfigurationError";
    this.reasons = reasons;
  }
}
