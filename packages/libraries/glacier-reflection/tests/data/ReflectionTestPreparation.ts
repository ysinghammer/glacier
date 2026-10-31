import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { DistributionContractPrepare } from "./DistributionContractPrepare.js";

/** Prepares genuine compiler and distribution inputs before Vitest starts isolated workers. */
class ReflectionTestPreparation {
  /**
   * Rebuilds compiler and distribution inputs before isolated Vitest workers start.
   * @returns Resolves with no value after all generated inputs are ready.
   * @throws {Error} When a compiler cannot start or exits unsuccessfully.
   */
  public static async run(): Promise<void> {
    await rm(new URL("../artifacts/compiler/", import.meta.url), { recursive: true, force: true });
    await rm(new URL("../artifacts/distribution/", import.meta.url), {
      recursive: true,
      force: true,
    });
    await rm(new URL("../../dist/", import.meta.url), { recursive: true, force: true });
    for (const project of ["tsconfig.json", "tsconfig.fixtures.json"]) {
      const result = spawnSync("pnpm", ["exec", "tsc", "--project", project], {
        cwd: new URL("../..", import.meta.url),
        stdio: "inherit",
        timeout: 120_000,
      });
      if (result.error !== undefined) throw result.error;
      if (result.status !== 0) throw new Error(`Reflection preparation failed: ${project}`);
    }
    await DistributionContractPrepare.run();
  }
}

/**
 * Prepares generated inputs through the package-owned global setup hook.
 * @returns Resolves with no value when preparation completes.
 */
export default async function setup(): Promise<void> {
  await ReflectionTestPreparation.run();
}
