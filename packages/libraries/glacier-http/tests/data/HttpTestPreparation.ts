import { spawnSync } from "node:child_process";

/** Prepares genuine legacy TypeScript emission without a bundler or new dependency. */
class HttpTestPreparation {
  /**
   * Compiles the fixture, benchmark, and consumer projects before runtime scenarios execute.
   * @returns No value; generated JavaScript stays in ignored package artifacts.
   * @throws {Error} When a compiler process cannot start or any project fails.
   */
  public static run(): void {
    for (const project of [
      "tsconfig.fixtures.json",
      "tsconfig.benchmarks.json",
      "tsconfig.consumer.json",
    ]) {
      const result = spawnSync("pnpm", ["exec", "tsc", "--project", project], {
        cwd: new URL("../..", import.meta.url),
        stdio: "inherit",
        timeout: 120_000,
      });
      if (result.error !== undefined) throw result.error;
      if (result.status !== 0) throw new Error("HTTP consumer compilation failed");
    }
  }
}

/**
 * Vitest global setup compiles test-owned TypeScript fixtures before discovery runs.
 * @returns No value; setup completes only after all fixture projects compile.
 */
export default function setup(): void {
  HttpTestPreparation.run();
}
