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

/** Configuration may contain unredacted bindings, callbacks, and buffered transports. */
interface ILoggerFactoryState {
  readonly runtime: ILoggerRuntime;
  readonly bindings: Readonly<Record<string, unknown>>;
}
const LOGGER_FACTORY_STATES = new WeakMap<LoggerFactory, ILoggerFactoryState>();

/**
 * Root of the logging capability. It cannot log: it only creates loggers, one per context, and
 * flushes the transports they share.
 */
export class LoggerFactory {
  /** Preserves opaque factory serialization and validates receivers before exposing runtime state. */
  private get state(): ILoggerFactoryState {
    const state = LOGGER_FACTORY_STATES.get(this);
    if (state === undefined) throw new TypeError("Invalid logger factory receiver");
    return state;
  }

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

  /** Builds a factory, reporting an invalid configuration as a `rejected` outcome instead of throwing. */
  public static create(configuration: ILoggerConfiguration): ILoggerFactoryCreationOutcome {
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

  /**
   * Resolves once every transport that supports flushing has delivered its accepted entries.
   * A transport whose flush fails is reported to `onError`; the others are still drained and
   * this promise still resolves.
   */
  public async flush(): Promise<void> {
    const transports = new Set(
      this.state.runtime.transports.map((registration) => registration.transport),
    );
    await Promise.all([...transports].map((transport) => this.flushTransport(transport)));
  }

  private async flushTransport(transport: ITransport): Promise<void> {
    try {
      await transport.flush?.();
    } catch (cause) {
      this.state.runtime.reportError(TransportFailureError.from(cause));
    }
  }
}
