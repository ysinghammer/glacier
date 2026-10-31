import { describe, expect, it } from "vitest";
import { LoggerFactory, NodeFileTransport, NodeStdoutTransport } from "../../../index.js";
import { FakeProcessHost } from "../../doubles/FakeProcessHost.js";
import { InMemoryFileSystem } from "../../doubles/InMemoryFileSystem.js";
import { RecordingTransport } from "../../doubles/RecordingTransport.js";

describe("logger-owned state serialization", () => {
  it("keeps unredacted bindings and configuration out of nested logger and factory output", () => {
    const transport = new RecordingTransport();
    const factory = new LoggerFactory({
      level: "info",
      bindings: { credential: "synthetic-binding-secret" },
      redact: { paths: ["credential"] },
      transports: [{ transport, format: "json" }],
    });
    const result = factory.createLogger("StateSafety");
    if (result.outcome !== "created") throw new Error("Expected logger creation");
    const logger = result.logger;
    logger.info({ message: "opaque owners", logger, factory });
    expect(transport.entries[0]?.fields).toEqual({ logger: {}, factory: {} });
    expect(JSON.stringify(transport.entries)).not.toContain("synthetic-binding-secret");
    expect(JSON.stringify(logger)).toBe("{}");
    expect(JSON.stringify(factory)).toBe("{}");
    expect({ ...logger, ...factory }).toEqual({});
    const borrowedLogger: unknown = Object.create(logger);
    const borrowedFactory: unknown = Object.create(factory);
    expect(() => logger.child.call(borrowedLogger, {})).toThrow(TypeError);
    expect(() => factory.createLogger.call(borrowedFactory, "borrowed")).toThrow(TypeError);
  });

  it("does not expose pending log lines, files, or process handles through transport output", async () => {
    const host = new FakeProcessHost();
    const file = new NodeFileTransport({
      path: "safety.log",
      host,
      fileSystem: new InMemoryFileSystem(),
    });
    const stdout = new NodeStdoutTransport({ host });
    const recording = new RecordingTransport();
    const factory = new LoggerFactory({
      level: "info",
      transports: [file, stdout, recording].map((transport) => ({ transport, format: "json" })),
    });
    const result = factory.createLogger("TransportStateSafety");
    if (result.outcome !== "created") throw new Error("Expected logger creation");
    result.logger.info({ message: "synthetic-pending-line" });
    result.logger.info({ message: "opaque transports", file, stdout });
    expect(recording.entries[1]?.fields).toEqual({ file: {}, stdout: {} });
    expect(JSON.stringify([file, stdout])).toBe("[{},{}]");
    const borrowedFile: unknown = Object.create(file);
    const borrowedStdout: unknown = Object.create(stdout);
    expect(() => file.flush.call(borrowedFile)).toThrow(TypeError);
    expect(() => stdout.flush.call(borrowedStdout)).toThrow(TypeError);
    await factory.flush();
  });
});
