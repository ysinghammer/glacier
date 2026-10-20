import { Bindings } from "../domain/Bindings.js";
import type { ILoggerConfiguration } from "./ILoggerConfiguration.config.js";
import type { ILoggerCreationOutcome } from "./ILoggerCreationOutcome.js";
import type { ILoggerFactoryCreationOutcome } from "./ILoggerFactoryCreationOutcome.js";
import type { ILoggerFactoryOptions } from "./ILoggerFactoryOptions.js";
import type { ILoggerRuntime } from "./ILoggerRuntime.js";
import type { IRejectionReason } from "./IRejectionReason.js";
import { InvalidLoggerConfigurationError } from "./InvalidLoggerConfiguration.error.js";
import { Logger } from "./Logger.js";
import { LoggerConfigurationValidator } from "./LoggerConfigurationValidator.js";

/**
 * Root of the logging capability. It cannot log: it only creates loggers, one per context, and
 * flushes the transports they share.
 */
export class LoggerFactory {
  readonly #runtime: ILoggerRuntime;
  readonly #bindings: Readonly<Record<string, unknown>>;

  /**
   * Builds a factory from a configuration.
   * @throws InvalidLoggerConfigurationError carrying every rejection reason.
   */
  constructor(configuration: ILoggerConfiguration) {
    const reasons = LoggerConfigurationValidator.validate(configuration);
    if (reasons.length > 0) {
      throw new InvalidLoggerConfigurationError(reasons);
    }
    this.#runtime = {
      level: configuration.level,
      clock: configuration.clock ?? { now: () => new Date() },
      transports: [...configuration.transports],
    };
    this.#bindings = { ...configuration.bindings };
  }

  /** Builds a factory, reporting an invalid configuration as a `rejected` outcome instead of throwing. */
  static create(configuration: ILoggerConfiguration): ILoggerFactoryCreationOutcome {
    const reasons = LoggerConfigurationValidator.validate(configuration);
    if (reasons.length > 0) {
      return { outcome: "rejected", reasons };
    }
    return { outcome: "created", factory: new LoggerFactory(configuration) };
  }

  /**
   * Creates a logger for `context`. Rejects an empty context and bindings with empty or
   * reserved keys.
   */
  createLogger(context: string, options: ILoggerFactoryOptions = {}): ILoggerCreationOutcome {
    const reasons: IRejectionReason[] = [];
    if (context === "") {
      reasons.push({ code: "empty_context", message: "Context must not be empty" });
    }
    const bindings = options.bindings ?? {};
    reasons.push(...Bindings.validate(bindings));
    if (reasons.length > 0) {
      return { outcome: "rejected", reasons };
    }
    return {
      outcome: "created",
      logger: new Logger(this.#runtime, context, Bindings.merge(this.#bindings, bindings)),
    };
  }

  /** Resolves once every transport that supports flushing has delivered its accepted entries. */
  async flush(): Promise<void> {
    await Promise.all(
      this.#runtime.transports.map((registration) => registration.transport.flush?.()),
    );
  }
}
