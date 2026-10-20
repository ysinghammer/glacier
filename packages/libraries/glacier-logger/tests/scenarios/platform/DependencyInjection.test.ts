// @scenario PLT-004
import { describe, expect, it } from "vitest";
import { LoggerFactory, NodeFileTransport, NodeStdoutTransport } from "../../../index.js";
import { FakeProcessHost } from "../../doubles/FakeProcessHost.js";
import { InMemoryFileSystem } from "../../doubles/InMemoryFileSystem.js";
import { IS_NODE } from "../../doubles/RuntimeKind.js";

function provideLoggerFactory(
  host: FakeProcessHost,
  fileSystem: InMemoryFileSystem,
): LoggerFactory {
  return new LoggerFactory({
    level: "info",
    bindings: { service: "billing" },
    transports: [
      { transport: new NodeStdoutTransport({ host }), format: "pretty" },
      {
        transport: new NodeFileTransport({ path: "logs/app.log", fileSystem, host }),
        format: "json",
      },
    ],
  });
}

describe("dependency injection style composition", () => {
  it.runIf(IS_NODE)(
    "logs two contexts built by a provider function to pretty stdout and a JSON file",
    async () => {
      const host = new FakeProcessHost();
      const fileSystem = new InMemoryFileSystem();
      const factory = provideLoggerFactory(host, fileSystem);
      const users = factory.createLogger("UserService");
      const orders = factory.createLogger("OrderService");
      if (users.outcome !== "created" || orders.outcome !== "created") {
        throw new Error("expected created loggers");
      }

      users.logger.info({ message: "user created", userId: 42 });
      orders.logger.child({ requestId: "r-1" }).error({ err: new Error("lookup failed") });
      await factory.flush();

      const stdout = host.stdout.chunks.join("");
      expect(stdout).toContain("[UserService] user created");
      expect(stdout).toContain("[OrderService]");
      expect(stdout).not.toContain('"context"');
      const lines = (fileSystem.files.get("logs/app.log") ?? "").split("\n").filter(Boolean);
      expect(lines.map((line) => JSON.parse(line))).toMatchObject([
        { level: "info", context: "UserService", message: "user created", service: "billing" },
        {
          level: "error",
          context: "OrderService",
          requestId: "r-1",
          err: { message: "lookup failed" },
        },
      ]);
    },
  );
});
