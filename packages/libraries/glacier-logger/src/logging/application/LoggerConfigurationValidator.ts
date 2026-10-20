import { RedactionPaths } from "../../serialization/domain/RedactionPaths.js";
import { Bindings } from "../domain/Bindings.js";
import { LogLevels } from "../domain/LogLevels.js";
import type { ILoggerConfiguration } from "./ILoggerConfiguration.config.js";
import type { IRejectionReason } from "./IRejectionReason.js";

/** Checks a configuration and reports every problem at once. */
export class LoggerConfigurationValidator {
  /** Returns all rejection reasons. An empty result means the configuration is valid. */
  static validate(configuration: ILoggerConfiguration): readonly IRejectionReason[] {
    const reasons: IRejectionReason[] = [];

    if (!LogLevels.isLogLevel(configuration.level)) {
      reasons.push({
        code: "invalid_level",
        message: `Unknown global level "${String(configuration.level)}"`,
      });
    }

    if (configuration.transports.length === 0) {
      reasons.push({ code: "no_transports", message: "At least one transport is required" });
    }
    for (const registration of configuration.transports) {
      if (registration.level !== undefined && !LogLevels.isLogLevel(registration.level)) {
        reasons.push({
          code: "invalid_transport_level",
          message: `Unknown transport level "${String(registration.level)}"`,
        });
      }
    }

    reasons.push(...Bindings.validate(configuration.bindings ?? {}));

    for (const path of configuration.redact?.paths ?? []) {
      if (!RedactionPaths.isValid(path)) {
        reasons.push({
          code: "invalid_redact_path",
          message: `Redact path "${path}" must be non-empty dot-separated segments without wildcards`,
        });
      }
    }

    return reasons;
  }
}
