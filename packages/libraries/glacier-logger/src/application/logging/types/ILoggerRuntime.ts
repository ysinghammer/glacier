import type { ILogLevel } from "../../../domain/logging/types/ILogLevel.js";
import type { IRedaction } from "../../../domain/logging/types/IRedaction.js";
import type { IClock } from "../ports/outbound/IClock.port.js";
import type { ITransportRegistration } from "./ITransportRegistration.js";

/** Validated settings shared by a factory and its loggers for filtering and delivery. */
export interface ILoggerRuntime {
  /** Global minimum level applied before routing entries to transports. */
  readonly level: ILogLevel;
  /** Clock used to timestamp each accepted log call. */
  readonly clock: IClock;
  /** Paths and replacement text applied to sensitive entry values. */
  readonly redaction: IRedaction;
  /** Destination registrations, in delivery order. */
  readonly transports: readonly ITransportRegistration[];
  /**
   * Routes logging and delivery failures to the configured reporter.
   * @param error Failure to report.
   * @returns No value; reporting does not throw.
   */
  readonly reportError: (error: Error) => void;
}
