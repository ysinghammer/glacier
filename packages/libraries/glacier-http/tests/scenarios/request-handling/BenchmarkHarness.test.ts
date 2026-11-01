import { describe, expect, it } from "vitest";
import { BenchmarkHarness } from "../../support/benchmarks/BenchmarkHarness.js";
import { BenchmarkArguments } from "../../support/benchmarks/BenchmarkArguments.js";
import { BenchmarkClient } from "../../support/benchmarks/BenchmarkClient.js";
import { HttpServer } from "../../../index.js";

describe("fixed-work benchmark correctness without timing gates", () => {
  it("separate compiled server/client processes consume projected GET/POST bodies and drain logs", async () => {
    const result = await BenchmarkHarness.run(
      new URL("../../artifacts/benchmarks/GlacierBenchmark.js", import.meta.url),
      2,
      8,
      4,
      2,
    );
    expect(result).toMatchObject({
      configuration: { concurrency: 2, requests: 8, warmupRequests: 4, samples: 2 },
      warmup: { correct: 4, incorrect: 0, transportErrors: 0 },
      verification: [401, 400, 400, 415],
      before: { logs: 8, diagnostics: 0 },
      results: [
        {
          client: { correct: 8, incorrect: 0, transportErrors: 0 },
          server: { logs: 16, diagnostics: 0 },
        },
        {
          client: { correct: 8, incorrect: 0, transportErrors: 0 },
          server: { logs: 24, diagnostics: 0 },
        },
      ],
    });
  });
  it("rejects malformed CLI loads instead of silently changing work", () => {
    expect(BenchmarkArguments.positive("32", "concurrency")).toBe(32);
    for (const value of [undefined, "0", "-1", "1.5", "Infinity", "9007199254740992"])
      expect(() => BenchmarkArguments.positive(value, "requests")).toThrow("Invalid requests");
  });
  it("does not label real wrong responses or an exited server as successful measurements", async () => {
    const server = HttpServer.create({ controllers: [], onError: () => {} });
    await server.listen({ host: "127.0.0.1", port: 0 });
    try {
      const address = server.address();
      if (address === undefined) throw new Error("Missing correctness listener");
      const result = await BenchmarkClient.run(address.port, 2, 4);
      expect(result).toMatchObject({ requests: 4, correct: 0, incorrect: 4, transportErrors: 0 });
    } finally {
      await server.close();
    }
    await expect(
      BenchmarkHarness.run(
        new URL("../../artifacts/benchmarks/BenchmarkClientProcess.js", import.meta.url),
        2,
        4,
        2,
        1,
      ),
    ).rejects.toThrow("exited before IPC");
  });
});
