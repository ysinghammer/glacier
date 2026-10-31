import { spawnSync } from "node:child_process";

/** Prepares genuine legacy TypeScript emission without a bundler or new dependency. */
class HttpTestPreparation {
  /** Compiles only test-owned consumer inputs; generated files remain ignored under artifacts. */
  public static run(): void {
    const result = spawnSync("pnpm", ["exec", "tsc", "--project", "tsconfig.fixtures.json"], {
      cwd: new URL("../..", import.meta.url),
      stdio: "inherit",
      timeout: 120_000,
    });
    if (result.error !== undefined) throw result.error;
    if (result.status !== 0) throw new Error("HTTP consumer compilation failed");
  }
}

/** Vitest-owned setup delegates compilation; it never starts resources or another test runner. */
export default function setup(): void {
  HttpTestPreparation.run();
}
