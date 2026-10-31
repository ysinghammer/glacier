import { Bindings } from "../../domain/logging/Bindings.js";
import type { ILogCall } from "../../domain/logging/types/ILogCall.js";
import type { ILogFields } from "../../domain/logging/types/ILogFields.js";
import type { ILogEntry } from "../../domain/logging/types/ILogEntry.js";
import type { ILogLevel } from "../../domain/logging/types/ILogLevel.js";
import { LogEntries } from "../../domain/logging/LogEntries.js";
import { LogLevels } from "../../domain/logging/LogLevels.js";
import { TransportDelivery } from "./TransportDelivery.js";
import { TransportFailureError } from "./errors/TransportFailure.error.js";
import { InvalidBindingsError } from "./errors/InvalidBindings.error.js";

/** State kept outside logger instances so bindings are not enumerable properties. */
interface ILoggerState {
  /** Immutable shared settings used to timestamp, filter, redact, and deliver entries. */
  readonly runtime: ILoggerRuntime;
  /** Context label attached to entries written by the logger. */
  readonly context: string;
  /** Logger-specific fields merged into each emitted entry. */
  readonly bindings: Readonly<Record<string, unknown>>;
}
const LOGGER_STATES = new WeakMap<Logger, ILoggerState>();
import type { ITransportRegistration } from "./types/ITransportRegistration.js";
import type { ILoggerRuntime } from "./types/ILoggerRuntime.js";

/** Factory-created context logger that writes redacted entries to eligible transports. */
export class Logger {
  /** Retrieves non-enumerable logger state.
   * @returns Runtime settings, context, and bindings associated with this logger.
   * @throws TypeError if accessed with a receiver not initialized as a logger.
   */
  private get state(): ILoggerState {
    const state = LOGGER_STATES.get(this);
    if (state === undefined) throw new TypeError("Invalid logger receiver");
    return state;
  }

  /** Initializes a logger from factory-validated state.
   * @param runtime Shared filtering, redaction, clock, and transport settings.
   * @param context Non-empty context label attached to each entry.
   * @param bindings Read-only fields merged into each entry.
   */
  constructor(
    runtime: ILoggerRuntime,
    context: string,
    bindings: Readonly<Record<string, unknown>>,
  ) {
    LOGGER_STATES.set(this, { runtime, context, bindings });
  }

  /** Emits a trace-level call when enabled by global and transport thresholds.
   * @param call Message and fields to include in the entry.
   * @returns No value; matching transports receive the entry.
   */
  public trace(call: ILogCall): void {
    this.log("trace", call);
  }

  /** Emits a debug-level call when enabled by global and transport thresholds.
   * @param call Message and fields to include in the entry.
   * @returns No value; matching transports receive the entry.
   */
  public debug(call: ILogCall): void {
    this.log("debug", call);
  }

  /** Emits an info-level call when enabled by global and transport thresholds.
   * @param call Message and fields to include in the entry.
   * @returns No value; matching transports receive the entry.
   */
  public info(call: ILogCall): void {
    this.log("info", call);
  }

  /** Emits a warn-level call when enabled by global and transport thresholds.
   * @param call Message and fields to include in the entry.
   * @returns No value; matching transports receive the entry.
   */
  public warn(call: ILogCall): void {
    this.log("warn", call);
  }

  /** Emits an error-level call when enabled by global and transport thresholds.
   * @param call Message and fields to include in the entry.
   * @returns No value; matching transports receive the entry.
   */
  public error(call: ILogCall): void {
    this.log("error", call);
  }

  /** Emits a fatal-level call when enabled by global and transport thresholds.
   * @param call Message and fields to include in the entry.
   * @returns No value; matching transports receive the entry.
   */
  public fatal(call: ILogCall): void {
    this.log("fatal", call);
  }

  /** Creates a logger with this context and additional bindings, leaving this logger unchanged.
   * @param bindings Fields overlaid on this logger's bindings; keys must be valid.
   * @returns New logger using the merged bindings and shared runtime settings.
   * @throws InvalidBindingsError when bindings contain empty or reserved keys.
   */
  public child(bindings: ILogFields): Logger {
    const violations = Bindings.validate(bindings);
    if (violations.length > 0) {
      throw new InvalidBindingsError(violations);
    }
    return new Logger(
      this.state.runtime,
      this.state.context,
      Bindings.merge(this.state.bindings, bindings),
    );
  }

  /** Applies global and per-transport thresholds before constructing and delivering an entry.
   * @param level Severity used for threshold checks and the emitted entry.
   * @param call Message and fields supplied by the caller.
   * @returns No value; entries below the global threshold are dropped.
   */
  private log(level: ILogLevel, call: ILogCall): void {
    if (!LogLevels.isAtLeast(level, this.state.runtime.level)) {
      return;
    }
    const entry = LogEntries.create({
      level,
      time: this.state.runtime.clock.now(),
      context: this.state.context,
      bindings: this.state.bindings,
      call,
      redaction: this.state.runtime.redaction,
    });
    for (const registration of this.state.runtime.transports) {
      if (LogLevels.isAtLeast(level, registration.level ?? this.state.runtime.level)) {
        this.deliver(entry, registration);
      }
    }
  }

  /** Formats and sends an accepted entry, reporting synchronous destination failures.
   * @param entry Redacted entry to deliver.
   * @param registration Destination and rendering choices for this delivery.
   * @returns No value; synchronous transport failures go to the configured reporter.
   */
  private deliver(entry: ILogEntry, registration: ITransportRegistration): void {
    try {
      const delivery = new TransportDelivery(entry, registration, this.state.runtime.reportError);
      registration.transport.write(entry, delivery);
    } catch (cause) {
      this.state.runtime.reportError(TransportFailureError.from(cause));
    }
  }
}
