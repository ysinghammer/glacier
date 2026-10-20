// @scenario TRN-004
// @scenario TRN-005
import { afterEach, describe, expect, it } from "vitest";
import { LoggerFactory, NodeFileTransport, TransportFailureError } from "../../../index.js";
import type { ILoggerConfiguration, Logger } from "../../../index.js";
import { FakeProcessHost } from "../../doubles/FakeProcessHost.js";
import { InMemoryFileSystem } from "../../doubles/InMemoryFileSystem.js";
import { IS_NODE } from "../../doubles/RuntimeKind.js";

const ARTIFACT_ROOT = "tests/artifacts/transport-files";

function loggerFor(
  transport: NodeFileTransport,
  configuration: Partial<ILoggerConfiguration> = {},
): { readonly factory: LoggerFactory; readonly logger: Logger } {
  const factory = new LoggerFactory({
    level: "info",
    transports: [{ transport, format: "json" }],
    ...configuration,
  });
  const created = factory.createLogger("Files");
  if (created.outcome !== "created") {
    throw new Error("expected a created logger");
  }
  return { factory, logger: created.logger };
}

describe("file transport", () => {
  const createdRoots: string[] = [];

  afterEach(async () => {
    if (!IS_NODE) {
      return;
    }
    const fileSystem = await import("node:fs/promises");
    for (const root of createdRoots.splice(0)) {
      await fileSystem.rm(root, { recursive: true, force: true });
    }
  });

  it("creates missing parent directories and appends to an existing file", async () => {
    const fileSystem = new InMemoryFileSystem();
    fileSystem.files.set("logs/app/service.log", "existing\n");
    const transport = new NodeFileTransport({
      path: "logs/app/service.log",
      fileSystem,
      host: new FakeProcessHost(),
    });
    const { factory, logger } = loggerFor(transport);

    logger.info({ message: "first" });
    await factory.flush();
    logger.info({ message: "second" });
    await factory.flush();

    expect(fileSystem.directories).toEqual(["logs/app", "logs/app"]);
    const lines = (fileSystem.files.get("logs/app/service.log") ?? "").split("\n");
    expect(lines[0]).toBe("existing");
    expect(
      lines.slice(1, 3).map((line) => (JSON.parse(line) as { message: string }).message),
    ).toEqual(["first", "second"]);
  });

  it("writes a bare file name or a root file without creating a directory", async () => {
    const fileSystem = new InMemoryFileSystem();
    const host = new FakeProcessHost();
    const bare = loggerFor(new NodeFileTransport({ path: "bare.log", fileSystem, host }));
    const rooted = loggerFor(new NodeFileTransport({ path: "/rooted.log", fileSystem, host }));

    bare.logger.info({ message: "bare" });
    rooted.logger.info({ message: "rooted" });
    await bare.factory.flush();
    await rooted.factory.flush();

    expect(fileSystem.directories).toEqual([]);
    expect([...fileSystem.files.keys()]).toEqual(["bare.log", "/rooted.log"]);
  });

  it("reports a failing file write to onError without throwing to the caller", async () => {
    const reported: Error[] = [];
    const fileSystem = new InMemoryFileSystem();
    fileSystem.appendFailure = new Error("EACCES: permission denied");
    const transport = new NodeFileTransport({
      path: "logs/denied.log",
      fileSystem,
      host: new FakeProcessHost(),
    });
    const { factory, logger } = loggerFor(transport, { onError: (error) => reported.push(error) });

    expect(() => {
      logger.info({ message: "lost" });
    }).not.toThrow();
    await factory.flush();

    expect(reported).toHaveLength(1);
    expect(reported[0]).toBeInstanceOf(TransportFailureError);
    expect(reported[0]?.message).toContain("EACCES: permission denied");
  });

  it("rejects an empty path", () => {
    expect(
      () =>
        new NodeFileTransport({
          path: "",
          fileSystem: new InMemoryFileSystem(),
          host: new FakeProcessHost(),
        }),
    ).toThrow("non-empty path");
  });

  it.runIf(IS_NODE)("appends to a real file below directories it creates", async () => {
    const root = `${ARTIFACT_ROOT}/${crypto.randomUUID()}`;
    createdRoots.push(root);
    const path = `${root}/nested/app.log`;
    const { factory, logger } = loggerFor(new NodeFileTransport({ path }));

    logger.info({ message: "one" });
    await factory.flush();
    logger.warn({ message: "two" });
    await factory.flush();

    const fileSystem = await import("node:fs/promises");
    const lines = (await fileSystem.readFile(path, "utf8")).trim().split("\n");
    expect(lines.map((line) => (JSON.parse(line) as { message: string }).message)).toEqual([
      "one",
      "two",
    ]);
  });

  it.runIf(IS_NODE)("reports a real file error to onError", async () => {
    const root = `${ARTIFACT_ROOT}/${crypto.randomUUID()}`;
    createdRoots.push(root);
    const fileSystem = await import("node:fs/promises");
    await fileSystem.mkdir(`${root}/blocked.log`, { recursive: true });
    const reported: Error[] = [];
    const { factory, logger } = loggerFor(new NodeFileTransport({ path: `${root}/blocked.log` }), {
      onError: (error) => reported.push(error),
    });

    logger.info({ message: "lost" });
    await factory.flush();

    expect(reported).toHaveLength(1);
    expect(reported[0]).toBeInstanceOf(TransportFailureError);
  });

  it.runIf(!IS_NODE)("refuses to start outside Node without a host", () => {
    expect(() => new NodeFileTransport({ path: "a.log" })).toThrow(
      "Node transports need a Node.js process",
    );
  });
});
