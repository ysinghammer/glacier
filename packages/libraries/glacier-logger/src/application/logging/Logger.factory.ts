import { Bindings } from "../../domain/logging/Bindings.js";
import { EnvironmentDiagnostics } from "../../infrastructure/logging/adapters/outbound/EnvironmentDiagnostics.adapter.js";
import { PathRedactor } from "../../domain/serialization/PathRedactor.js";
import type { ILoggerConfiguration } from "./ILoggerConfiguration.config.js";
import type { ILoggerCreationOutcome } from "./types/ILoggerCreationOutcome.js";
import type { ILoggerFactoryCreationOutcome } from "./types/ILoggerFactoryCreationOutcome.js";
import type { ILoggerFactoryOptions } from "./types/ILoggerFactoryOptions.js";
import type { ILoggerRuntime } from "./types/ILoggerRuntime.js";
import type { IRejectionReason } from "./types/IRejectionReason.js";
import { FailureReporter } from "./FailureReporter.js";
import { InvalidLoggerConfigurationError } from "./errors/InvalidLoggerConfiguration.error.js";
import { Logger } from "./Logger.js";
import { LoggerConfigurationValidator } from "./LoggerConfigurationValidator.js";
import type { ITransport } from "./ports/outbound/ITransport.port.js";
import { TransportFailureError } from "./errors/TransportFailure.error.js";

/** Keeps sensitive factory state out of logger object properties. */
interface ILoggerFactoryState {
  /** Validated settings shared by loggers created by this factory. */
  readonly runtime: ILoggerRuntime;
  /** Factory-level fields copied into each created logger. */
  readonly bindings: Readonly<Record<string, unknown>>;
}
const LOGGER_FACTORY_STATES = new WeakMap<LoggerFactory, ILoggerFactoryState>();

/** Creates context loggers and coordinates flushing of their shared transports. */
export class LoggerFactory {
  /** Reads private factory state without making it enumerable.
   * @returns Validated runtime settings and factory bindings.
   * @throws TypeError if accessed with a receiver not initialized as a factory.
   */
  private get state(): ILoggerFactoryState {
    const state = LOGGER_FACTORY_STATES.get(this);
    if (state === undefined) throw new TypeError("Invalid logger factory receiver");
    return state;
  }

  /** Validates configuration and initializes shared runtime settings.
   * @param configuration Settings and transport registrations for the factory.
   * @throws InvalidLoggerConfigurationError when validation finds any rejection reasons.
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
    const runtime: ILoggerRuntime = {
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
    LOGGER_FACTORY_STATES.set(this, { runtime, bindings: { ...configuration.bindings } });
  }

  /** Validates configuration and returns either a factory or its rejection reasons.
   * @param configuration Settings and transport registrations to validate.
   * @returns `created` with the factory, or `rejected` with all validation reasons.
   */
  public static create(configuration: ILoggerConfiguration): ILoggerFactoryCreationOutcome {
    const reasons = LoggerConfigurationValidator.validate(configuration);
    if (reasons.length > 0) {
      return { outcome: "rejected", reasons };
    }
    return { outcome: "created", factory: new LoggerFactory(configuration) };
  }

  /** Creates an immutable logger for a context with factory and optional local bindings.
   * @param context Non-empty name attached to entries from the logger.
   * @param options Per-logger bindings; defaults to an empty options object.
   * @returns `created` with the logger, or `rejected` with all input validation reasons.
   */
  public createLogger(
    context: string,
    options: ILoggerFactoryOptions = {},
  ): ILoggerCreationOutcome {
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
      logger: new Logger(
        this.state.runtime,
        context,
        Bindings.merge(this.state.bindings, bindings),
      ),
    };
  }

  /** Drains each distinct configured transport and reports flush failures.
   * @returns Promise resolves after all flushes; failures are reported and do not reject it.
   */
  public async flush(): Promise<void> {
    const transports = new Set(
      this.state.runtime.transports.map((registration) => registration.transport),
    );
    await Promise.all([...transports].map((transport) => this.flushTransport(transport)));
  }

  /** Flushes one transport without allowing its failure to reject the factory flush.
   * @param transport Configured destination to drain.
   * @returns Promise resolving after optional transport flushing and failure reporting.
   */
  private async flushTransport(transport: ITransport): Promise<void> {
    try {
      await transport.flush?.();
    } catch (cause) {
      this.state.runtime.reportError(TransportFailureError.from(cause));
    }
  }
}
