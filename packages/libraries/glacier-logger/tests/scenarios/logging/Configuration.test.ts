// @scenario LOG-010
// @scenario LOG-011
import { describe, expect, it } from "vitest";
import { InvalidLoggerConfigurationError, LoggerFactory } from "../../../index.js";
import type { ILoggerConfiguration } from "../../../index.js";
import { RecordingTransport } from "../../doubles/RecordingTransport.js";

function validConfiguration(): ILoggerConfiguration {
  return { level: "info", transports: [{ transport: new RecordingTransport(), format: "json" }] };
}

describe("LoggerFactory.create", () => {
  it("returns created for a valid configuration", () => {
    const result = LoggerFactory.create(validConfiguration());

    expect(result.outcome).toBe("created");
    expect(result.outcome === "created" && result.factory).toBeInstanceOf(LoggerFactory);
  });

  it("accepts valid redact paths, bindings and transport levels", () => {
    const result = LoggerFactory.create({
      ...validConfiguration(),
      bindings: { service: "api" },
      redact: { paths: ["password", "user.token"], censor: "***" },
      transports: [{ transport: new RecordingTransport(), format: "pretty", level: "warn" }],
    });

    expect(result.outcome).toBe("created");
  });

  it("rejects a configuration without transports", () => {
    const result = LoggerFactory.create({ level: "info", transports: [] });

    expect(result).toEqual({
      outcome: "rejected",
      reasons: [{ code: "no_transports", message: "At least one transport is required" }],
    });
  });

  it("rejects unknown global and transport levels", () => {
    const result = LoggerFactory.create({
      // @ts-expect-error deliberately invalid level
      level: "verbose",
      // @ts-expect-error deliberately invalid level
      transports: [{ transport: new RecordingTransport(), format: "json", level: "loud" }],
    });

    expect(result).toEqual({
      outcome: "rejected",
      reasons: [
        { code: "invalid_level", message: 'Unknown global level "verbose"' },
        { code: "invalid_transport_level", message: 'Unknown transport level "loud"' },
      ],
    });
  });

  it("rejects reserved and empty binding keys", () => {
    const result = LoggerFactory.create({
      ...validConfiguration(),
      bindings: { level: "x", "": 1 },
    });

    expect(result).toEqual({
      outcome: "rejected",
      reasons: [
        { code: "reserved_binding_key", message: 'Binding key "level" is reserved' },
        { code: "empty_binding_key", message: "Binding keys must not be empty" },
      ],
    });
  });

  it("rejects redact paths that are empty, wildcarded or have empty segments", () => {
    const result = LoggerFactory.create({
      ...validConfiguration(),
      redact: { paths: ["", "a.*", "a..b", "ok"] },
    });

    expect(result.outcome === "rejected" && result.reasons.map((reason) => reason.code)).toEqual([
      "invalid_redact_path",
      "invalid_redact_path",
      "invalid_redact_path",
    ]);
  });

  it("reports every problem at once", () => {
    const result = LoggerFactory.create({ level: "info", transports: [], bindings: { time: 1 } });

    expect(result.outcome === "rejected" && result.reasons).toHaveLength(2);
  });
});

describe("new LoggerFactory", () => {
  it("constructs a factory for a valid configuration", () => {
    expect(new LoggerFactory(validConfiguration())).toBeInstanceOf(LoggerFactory);
  });

  it("throws InvalidLoggerConfigurationError keeping the reasons", () => {
    const construct = (): LoggerFactory => new LoggerFactory({ level: "info", transports: [] });

    expect(construct).toThrow(InvalidLoggerConfigurationError);
    try {
      construct();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as InvalidLoggerConfigurationError).reasons).toEqual([
        { code: "no_transports", message: "At least one transport is required" },
      ]);
      expect((error as Error).message).toContain("At least one transport is required");
      expect((error as Error).name).toBe("InvalidLoggerConfigurationError");
    }
  });
});
