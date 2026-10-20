import type { ILogLevel } from "../domain/ILogLevel.js";
import type { IClock } from "./ports/outbound/IClock.port.js";
import type { ITransportRegistration } from "./ITransportRegistration.js";

/** Redaction settings: exact dot-separated paths, no wildcards. */
export interface IRedactConfiguration {
  readonly paths: readonly string[];
  readonly censor?: string;
}

/** Everything a `LoggerFactory` needs. Validated when the factory is created. */
export interface ILoggerConfiguration {
  /** Global minimum level, applied before any transport routing. */
  readonly level: ILogLevel;
  /** Merged into every entry. Keys must be non-empty and not reserved. */
  readonly bindings?: Readonly<Record<string, unknown>>;
  readonly redact?: IRedactConfiguration;
  /** Receives failures that cannot be thrown to the logging caller. */
  readonly onError?: (error: Error) => void;
  /** At least one registration is required. */
  readonly transports: readonly ITransportRegistration[];
  /** Timestamp source. Defaults to the system clock. */
  readonly clock?: IClock;
}
