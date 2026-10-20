import { Bindings } from "../domain/Bindings.js";
import type { ILogCall } from "../domain/ILogCall.js";
import type { ILogFields } from "../domain/ILogFields.js";
import type { ILogLevel } from "../domain/ILogLevel.js";
import { LogEntries } from "../domain/LogEntries.js";
import { LogLevels } from "../domain/LogLevels.js";
import { InvalidBindingsError } from "./InvalidBindings.error.js";
import type { ILoggerRuntime } from "./ILoggerRuntime.js";

/**
 * Writes entries for one context. Obtain it from `LoggerFactory.createLogger`; it is immutable
 * and safe to share. Entries below the global level are dropped, the rest go to every transport
 * whose own minimum level they meet.
 */
export class Logger {
  readonly #runtime: ILoggerRuntime;
  readonly #context: string;
  readonly #bindings: Readonly<Record<string, unknown>>;

  /** Not for direct use: the factory supplies validated runtime, context and bindings. */
  constructor(
    runtime: ILoggerRuntime,
    context: string,
    bindings: Readonly<Record<string, unknown>>,
  ) {
    this.#runtime = runtime;
    this.#context = context;
    this.#bindings = bindings;
  }

  /** Logs at `trace` level. */
  trace(call: ILogCall): void {
    this.#log("trace", call);
  }

  /** Logs at `debug` level. */
  debug(call: ILogCall): void {
    this.#log("debug", call);
  }

  /** Logs at `info` level. */
  info(call: ILogCall): void {
    this.#log("info", call);
  }

  /** Logs at `warn` level. */
  warn(call: ILogCall): void {
    this.#log("warn", call);
  }

  /** Logs at `error` level. */
  error(call: ILogCall): void {
    this.#log("error", call);
  }

  /** Logs at `fatal` level. */
  fatal(call: ILogCall): void {
    this.#log("fatal", call);
  }

  /**
   * Returns a logger with the same context whose bindings are this logger's bindings overlaid
   * with `bindings`. This logger is not changed.
   * @throws InvalidBindingsError when the bindings contain empty or reserved keys.
   */
  child(bindings: ILogFields): Logger {
    const violations = Bindings.validate(bindings);
    if (violations.length > 0) {
      throw new InvalidBindingsError(violations);
    }
    return new Logger(this.#runtime, this.#context, Bindings.merge(this.#bindings, bindings));
  }

  #log(level: ILogLevel, call: ILogCall): void {
    if (!LogLevels.isAtLeast(level, this.#runtime.level)) {
      return;
    }
    const entry = LogEntries.create({
      level,
      time: this.#runtime.clock.now(),
      context: this.#context,
      bindings: this.#bindings,
      call,
    });
    for (const registration of this.#runtime.transports) {
      if (LogLevels.isAtLeast(level, registration.level ?? this.#runtime.level)) {
        registration.transport.write(entry);
      }
    }
  }
}
