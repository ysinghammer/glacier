// @scenario TRN-011
import { describe, expect, it } from "vitest";
import { LoggerFactory, NodeFileTransport, NodeStdoutTransport } from "../../../index.js";
import { FakeProcessHost } from "../../doubles/FakeProcessHost.js";
import { InMemoryFileSystem } from "../../doubles/InMemoryFileSystem.js";
import { IS_NODE } from "../../doubles/RuntimeKind.js";

describe("transport fan-out", () => {
  it.runIf(IS_NODE)("routes each entry by the level and format of every transport", async () => {
    const host = new FakeProcessHost();
    const fileSystem = new InMemoryFileSystem();
    const factory = new LoggerFactory({
      level: "trace",
      transports: [
        { transport: new NodeStdoutTransport({ host }), level: "debug", format: "pretty" },
        {
          transport: new NodeFileTransport({ path: "logs/app.log", fileSystem, host }),
          level: "warn",
          format: "json",
        },
      ],
    });
    const created = factory.createLogger("FanOut");
    if (created.outcome !== "created") {
      throw new Error("expected a created logger");
    }

    created.logger.trace({ message: "trace-entry" });
    created.logger.debug({ message: "debug-entry" });
    created.logger.warn({ message: "warn-entry" });
    await factory.flush();

    const stdout = host.stdout.chunks.join("");
    expect(stdout).not.toContain("trace-entry");
    expect(stdout).toContain("debug-entry");
    expect(stdout).toContain("warn-entry");
    expect(stdout).not.toContain('"message"');
    const lines = (fileSystem.files.get("logs/app.log") ?? "").split("\n").filter(Boolean);
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] ?? "")).toMatchObject({ level: "warn", message: "warn-entry" });
  });
});
