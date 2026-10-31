import { Agent, request } from "node:http";
import { performance } from "node:perf_hooks";
import type { IBenchmarkSample } from "./IBenchmarkSample.js";

/** Node-built-in fixed-concurrency client; latencies end only after full response consumption. */
export class BenchmarkClient {
  /**
   * Runs fixed concurrent GET/POST work and reports fully consumed response measurements.
   * @param port Listening benchmark server port.
   * @param concurrency Maximum simultaneous requests and keep-alive sockets.
   * @param requests Total requests divided across the concurrent workers.
   * @returns Promise fulfilled with counts, throughput, latency, bytes, and memory snapshot.
   */
  public static async run(
    port: number,
    concurrency: number,
    requests: number,
  ): Promise<IBenchmarkSample> {
    const agent = new Agent({ keepAlive: true, maxSockets: concurrency });
    const latencies: number[] = [];
    let next = 0;
    let correct = 0;
    let incorrect = 0;
    let transportErrors = 0;
    let bytes = 0;
    const start = performance.now();
    try {
      await Promise.all(
        Array.from({ length: concurrency }, async () => {
          while (next < requests) {
            const index = next++;
            const started = performance.now();
            try {
              const result = await BenchmarkClient.send(port, index % 2 === 1, agent);
              latencies.push(performance.now() - started);
              bytes += result.bytes;
              if (result.isCorrect) correct++;
              else incorrect++;
            } catch {
              transportErrors++;
            }
          }
        }),
      );
    } finally {
      agent.destroy();
    }
    const elapsedMs = performance.now() - start;
    latencies.sort((left, right) => left - right);
    return {
      requests,
      correct,
      incorrect,
      transportErrors,
      bytes,
      elapsedMs,
      requestsPerSecond: (requests * 1000) / elapsedMs,
      latencyMs: {
        p50: BenchmarkClient.percentile(latencies, 0.5),
        p95: BenchmarkClient.percentile(latencies, 0.95),
        p99: BenchmarkClient.percentile(latencies, 0.99),
      },
      clientMemory: process.memoryUsage(),
    };
  }

  /**
   * Sends one bounded request and checks JSON projection, framing, and request identity.
   * @param port Listening benchmark server port.
   * @param isPost Whether to send the POST body instead of a GET query.
   * @param agent Optional keep-alive agent shared by the sample.
   * @returns Whether the response matches the contract and its consumed body byte count.
   */
  public static send(
    port: number,
    isPost: boolean,
    agent?: Agent,
  ): Promise<{ readonly isCorrect: boolean; readonly bytes: number }> {
    const body = JSON.stringify({ count: 7, label: "body", excluded: "strip-input" });
    return new Promise((resolve, reject) => {
      const outgoing = request(
        {
          host: "127.0.0.1",
          port,
          path: "/bench/items/item?count=7&excluded=strip-input",
          method: isPost ? "POST" : "GET",
          agent,
          headers: {
            authorization: "Bearer benchmark",
            ...(isPost
              ? { "content-type": "application/json", "content-length": Buffer.byteLength(body) }
              : {}),
          },
        },
        (response) => {
          const chunks: Buffer[] = [];
          response.on("data", (chunk: Buffer) => chunks.push(chunk));
          response.once("error", reject);
          response.once("end", () => {
            const value = Buffer.concat(chunks);
            const expected = JSON.stringify({
              id: "item",
              userId: "actor",
              count: 7,
              label: isPost ? "body" : "query",
            });
            const identity = response.headers["x-request-id"];
            resolve({
              bytes: value.length,
              isCorrect:
                response.statusCode === 200 &&
                value.toString() === expected &&
                response.headers["content-type"] === "application/json" &&
                response.headers["content-length"] === String(value.length) &&
                typeof identity === "string" &&
                /^[0-9a-f-]{36}$/.test(identity),
            });
          });
        },
      );
      outgoing.setTimeout(10_000, () => outgoing.destroy(new Error("Benchmark receive timeout")));
      outgoing.once("error", reject);
      outgoing.end(isPost ? body : undefined);
    });
  }

  /**
   * Selects a nearest-rank value from sorted latency observations.
   * @param values Latencies sorted in ascending order.
   * @param fraction Percentile fraction in the inclusive range used by the caller.
   * @returns Latency at the nearest rank.
   * @throws {Error} When no completed response latency is available.
   */
  private static percentile(values: readonly number[], fraction: number): number {
    const value = values[Math.ceil(values.length * fraction) - 1];
    if (value === undefined) throw new Error("No completed benchmark responses");
    return value;
  }
}
