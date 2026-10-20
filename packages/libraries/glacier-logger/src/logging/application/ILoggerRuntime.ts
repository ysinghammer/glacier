import type { ILogLevel } from "../domain/ILogLevel.js";
import type { IRedaction } from "../domain/IRedaction.js";
import type { IClock } from "./ports/outbound/IClock.port.js";
import type { ITransportRegistration } from "./ITransportRegistration.js";

/** Validated, immutable settings shared by a factory and every logger it creates. */
export interface ILoggerRuntime {
  readonly level: ILogLevel;
  readonly clock: IClock;
  readonly redaction: IRedaction;
  readonly transports: readonly ITransportRegistration[];
  /** Delivers failures to `onError`, or to the default diagnostics line. Never throws. */
  readonly reportError: (error: Error) => void;
}
