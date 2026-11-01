import type { ILogLevel } from "../../domain/logging/types/ILogLevel.js";
import type { IDiagnosticsOutput } from "./ports/outbound/IDiagnosticsOutput.port.js";
import type { IClock } from "./ports/outbound/IClock.port.js";
import type { ITransportRegistration } from "./types/ITransportRegistration.js";

/** Selects exact log-field paths whose values are replaced before delivery. */
export interface IRedactConfiguration {
  /** Paths use non-empty dot-separated segments and do not support wildcards. */
  readonly paths: readonly string[];
  /** Replacement text for matched values; omitted to use the redactor's default.
   * @default [Redacted]
   */
  readonly censor?: string;
}

/** Supplies validated settings and destinations used by a logger factory. */
export interface ILoggerConfiguration {
  /** Global minimum level; entries below it are dropped before transport routing. */
  readonly level: ILogLevel;
  /** Factory fields copied into every logger; omitted for no additional bindings. */
  readonly bindings?: Readonly<Record<string, unknown>>;
  /** Optional exact-path redaction settings; omitted to leave values uncensored. */
  readonly redact?: IRedactConfiguration;
  /**
   * Receives failures isolated from logging calls; omitted to use diagnostics output.
   * A throwing handler falls back to the diagnostics line.
   * @param error Failure raised during logging or delivery.
   * @returns No value; handles the reported failure.
   */
  readonly onError?: (error: Error) => void;
  /** Destination of the fallback failure line; defaults to Node stderr or browser console. */
  readonly diagnostics?: IDiagnosticsOutput;
  /** Destinations and rendering settings; at least one registration is required. */
  readonly transports: readonly ITransportRegistration[];
  /** Timestamp source; omitted to use the system clock. */
  readonly clock?: IClock;
}
