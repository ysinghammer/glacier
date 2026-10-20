import { Bindings } from "../domain/Bindings.js";
import { EnvironmentDiagnostics } from "../infrastructure/adapters/outbound/EnvironmentDiagnostics.adapter.js";
import { PathRedactor } from "../../serialization/domain/PathRedactor.js";
import type { ILoggerConfiguration } from "./ILoggerConfiguration.config.js";
import type { ILoggerCreationOutcome } from "./ILoggerCreationOutcome.js";
import type { ILoggerFactoryCreationOutcome } from "./ILoggerFactoryCreationOutcome.js";
import type { ILoggerFactoryOptions } from "./ILoggerFactoryOptions.js";
import type { ILoggerRuntime } from "./ILoggerRuntime.js";
import type { IRejectionReason } from "./IRejectionReason.js";
import { FailureReporter } from "./FailureReporter.js";
import { InvalidLoggerConfigurationError } from "./InvalidLoggerConfiguration.error.js";
import { Logger } from "./Logger.js";
import { LoggerConfigurationValidator } from "./LoggerConfigurationValidator.js";
import type { ITransport } from "./ports/outbound/ITransport.port.js";
import { TransportFailureError } from "./TransportFailure.error.js";

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
    const reporter = new FailureReporter(
      configuration.onError,
      configuration.diagnostics ?? new EnvironmentDiagnostics(),
    );
    this.#runtime = {
      level: configuration.level,
      redaction: {
        paths: [...(configuration.redact?.paths ?? [])],
        censor: configuration.redact?.censor ?? PathRedactor.DEFAULT_CENSOR,
      },
      clock: configuration.clock ?? { now: () => new Date() },
      transports: [...configuration.transports],
      reportError: (error) => {
        reporter.report(error);
      },
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

  /**
   * Resolves once every transport that supports flushing has delivered its accepted entries.
   * A transport whose flush fails is reported to `onError`; the others are still drained and
   * this promise still resolves.
   */
  async flush(): Promise<void> {
    const transports = new Set(
      this.#runtime.transports.map((registration) => registration.transport),
    );
    await Promise.all([...transports].map((transport) => this.#flushTransport(transport)));
  }

  async #flushTransport(transport: ITransport): Promise<void> {
    try {
      await transport.flush?.();
    } catch (cause) {
      this.#runtime.reportError(TransportFailureError.from(cause));
    }
  }
}
