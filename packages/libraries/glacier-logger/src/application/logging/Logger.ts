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

/** Logger bindings and runtime configuration are not loggable object properties. */
interface ILoggerState {
  readonly runtime: ILoggerRuntime;
  readonly context: string;
  readonly bindings: Readonly<Record<string, unknown>>;
}
const LOGGER_STATES = new WeakMap<Logger, ILoggerState>();
import type { ITransportRegistration } from "./types/ITransportRegistration.js";
import type { ILoggerRuntime } from "./types/ILoggerRuntime.js";

/**
 * Writes entries for one context. Obtain it from `LoggerFactory.createLogger`; it is immutable
 * and safe to share. Entries below the global level are dropped, the rest go to every transport
 * whose own minimum level they meet. A transport that throws is reported to `onError`; the call
 * never throws.
 */
export class Logger {
  /** Keeps unredacted bindings out of enumeration and rejects invalid borrowed receivers. */
  private get state(): ILoggerState {
    const state = LOGGER_STATES.get(this);
    if (state === undefined) throw new TypeError("Invalid logger receiver");
    return state;
  }

  /** Not for direct use: the factory supplies validated runtime, context and bindings. */
  constructor(
    runtime: ILoggerRuntime,
    context: string,
    bindings: Readonly<Record<string, unknown>>,
  ) {
    LOGGER_STATES.set(this, { runtime, context, bindings });
  }

  /** Logs at `trace` level. */
  public trace(call: ILogCall): void {
    this.log("trace", call);
  }

  /** Logs at `debug` level. */
  public debug(call: ILogCall): void {
    this.log("debug", call);
  }

  /** Logs at `info` level. */
  public info(call: ILogCall): void {
    this.log("info", call);
  }

  /** Logs at `warn` level. */
  public warn(call: ILogCall): void {
    this.log("warn", call);
  }

  /** Logs at `error` level. */
  public error(call: ILogCall): void {
    this.log("error", call);
  }

  /** Logs at `fatal` level. */
  public fatal(call: ILogCall): void {
    this.log("fatal", call);
  }

  /**
   * Returns a logger with the same context whose bindings are this logger's bindings overlaid
   * with `bindings`. This logger is not changed.
   * @throws InvalidBindingsError when the bindings contain empty or reserved keys.
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

  private deliver(entry: ILogEntry, registration: ITransportRegistration): void {
    try {
      const delivery = new TransportDelivery(entry, registration, this.state.runtime.reportError);
      registration.transport.write(entry, delivery);
    } catch (cause) {
      this.state.runtime.reportError(TransportFailureError.from(cause));
    }
  }
}
