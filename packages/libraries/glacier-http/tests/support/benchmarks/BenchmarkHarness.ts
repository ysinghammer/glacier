import { execFile, fork } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { once } from "node:events";
import { promisify } from "node:util";
import { cpus, totalmem, platform, release, arch } from "node:os";

/** Orchestrates isolated servers and clients; no cached output or timing acceptance thresholds. */
export class BenchmarkHarness {
  /**
   * Runs an isolated server, untimed verification, warmup, and repeated fresh-client samples.
   * @param serverFile Compiled server entry launched in a child process.
   * @param concurrency Requests in flight for each client process.
   * @param requests Measured requests per sample.
   * @param warmupRequests Requests used to warm the server outside measurements.
   * @param samples Number of fresh client samples to collect.
   * @returns Promise fulfilled with machine, configuration, verification, and sample results.
   * @throws {Error} Promise rejects when readiness, verification, sample, or exit checks fail.
   */
  public static async run(
    serverFile: URL,
    concurrency: number,
    requests: number,
    warmupRequests: number,
    samples: number,
  ): Promise<object> {
    const server = fork(serverFile, [], { stdio: ["ignore", "pipe", "pipe", "ipc"], execArgv: [] });
    let diagnostics = "";
    server.stderr?.on("data", (chunk: Buffer) => {
      diagnostics += chunk.toString();
    });
    server.stdout?.on("data", (chunk: Buffer) => {
      diagnostics += chunk.toString();
    });
    const exit = once(server, "exit");
    try {
      const ready = await BenchmarkHarness.message(server);
      if (
        typeof ready !== "object" ||
        ready === null ||
        !("port" in ready) ||
        typeof ready.port !== "number"
      )
        throw new Error("Invalid benchmark readiness");
      const clientFile = new URL("./BenchmarkClientProcess.js", serverFile);
      const verification = await BenchmarkHarness.verify(ready.port);
      const warmup = await BenchmarkHarness.client(
        clientFile,
        ready.port,
        concurrency,
        warmupRequests,
      );
      const before = await BenchmarkHarness.stats(server, warmupRequests + verification.length);
      const results: object[] = [];
      for (let index = 0; index < samples; index++) {
        const client = await BenchmarkHarness.client(clientFile, ready.port, concurrency, requests);
        results.push({
          client,
          server: await BenchmarkHarness.stats(
            server,
            warmupRequests + verification.length + (index + 1) * requests,
          ),
        });
      }
      server.send("stop");
      const [code] = await exit;
      if (code !== 0 || diagnostics !== "")
        throw new Error(`Benchmark server failed: ${diagnostics}`);
      return {
        date: new Date().toISOString(),
        node: process.version,
        machine: {
          cpu: cpus()[0]?.model,
          logicalCpus: cpus().length,
          memoryBytes: totalmem(),
          platform: platform(),
          release: release(),
          arch: arch(),
        },
        configuration: {
          concurrency,
          requests,
          warmupRequests,
          samples,
          getPostRatio: "1:1",
          keepAlive: true,
          pipelining: false,
        },
        verification,
        warmup,
        before,
        results,
      };
    } finally {
      if (server.connected) server.disconnect();
      if (server.exitCode === null) server.kill();
      await exit;
    }
  }

  /**
   * Verifies equivalent authentication, query, body, and media rejection over HTTP.
   * @param port Listening benchmark server port.
   * @returns Promise fulfilled with rejection statuses in probe order.
   * @throws {Error} Promise rejects when a rejection response is invalid or leaks input.
   */
  private static async verify(port: number): Promise<readonly number[]> {
    const base = `http://127.0.0.1:${port}/bench/items/item`;
    const statuses: number[] = [];
    for (const [url, options, expected] of [
      [base + "?count=7", {}, 401],
      [base + "?count=invalid", { headers: { authorization: "Bearer benchmark" } }, 400],
      [
        base,
        {
          method: "POST",
          headers: { authorization: "Bearer benchmark", "content-type": "application/json" },
          body: '{"count":"7","label":"body"}',
        },
        400,
      ],
      [
        base,
        {
          method: "POST",
          headers: { authorization: "Bearer benchmark", "content-type": "text/plain" },
          body: '{"count":7,"label":"body"}',
        },
        415,
      ],
    ] as const) {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(10_000) });
      const body: unknown = await response.json();
      if (
        response.status !== expected ||
        response.headers.get("content-type") !== "application/problem+json" ||
        typeof body !== "object" ||
        body === null ||
        !("status" in body) ||
        body.status !== expected ||
        (expected === 401 &&
          response.headers.get("www-authenticate") !== 'Bearer realm="benchmark"')
      )
        throw new Error("Benchmark rejection equivalence failed");
      const text = JSON.stringify(body);
      if (text.includes('"invalid"') || text.includes('"value"') || text.includes('"stack"'))
        throw new Error("Benchmark problem leaked input");
      statuses.push(response.status);
    }
    return statuses;
  }

  /**
   * Runs one fresh client process and validates its completed sample output.
   * @param clientFile Compiled client entry launched by Node.
   * @param port Listening benchmark server port.
   * @param concurrency Concurrent workers passed to the client.
   * @param requests Expected completed request count.
   * @returns Promise fulfilled with the parsed sample after correctness checks.
   * @throws {Error} Promise rejects when sample counts are wrong or diagnostics are written.
   */
  private static async client(
    clientFile: URL,
    port: number,
    concurrency: number,
    requests: number,
  ): Promise<unknown> {
    const result = await promisify(execFile)(
      process.execPath,
      [clientFile.pathname, String(port), String(concurrency), String(requests)],
      { timeout: 120_000 },
    );
    const sample: unknown = JSON.parse(result.stdout);
    if (
      typeof sample !== "object" ||
      sample === null ||
      !("correct" in sample) ||
      sample.correct !== requests ||
      !("incorrect" in sample) ||
      sample.incorrect !== 0 ||
      !("transportErrors" in sample) ||
      sample.transportErrors !== 0 ||
      result.stderr !== ""
    )
      throw new Error("Benchmark client correctness failed");
    return sample;
  }

  /**
   * Requests cumulative server statistics and checks diagnostics and completed log counts.
   * @param server Connected benchmark server child process.
   * @param expectedLogs Expected cumulative response-log count.
   * @returns Promise fulfilled with the child process statistics snapshot.
   * @throws {Error} Promise rejects when diagnostics occur or logs mismatch completed work.
   */
  private static async stats(server: ChildProcess, expectedLogs: number): Promise<unknown> {
    const result = BenchmarkHarness.message(server);
    server.send("stats");
    const value = await result;
    if (
      typeof value !== "object" ||
      value === null ||
      !("diagnostics" in value) ||
      value.diagnostics !== 0 ||
      !("logs" in value) ||
      value.logs !== expectedLogs
    )
      throw new Error("Benchmark diagnostics invalidated run");
    return value;
  }

  /**
   * Waits for one child IPC message, bounded by timeout and child exit.
   * @param server Connected benchmark server child process.
   * @returns Promise fulfilled with the first payload; child exit and timeout reject it.
   */
  private static async message(server: ChildProcess): Promise<unknown> {
    const cancellation = new AbortController();
    const signal = AbortSignal.any([cancellation.signal, AbortSignal.timeout(30_000)]);
    const message = once(server, "message", { signal });
    const exit = once(server, "exit", { signal }).then(() => {
      throw new Error("Benchmark server exited before IPC response");
    });
    try {
      const result = await Promise.race([message, exit]);
      return result[0];
    } finally {
      cancellation.abort();
    }
  }
}
