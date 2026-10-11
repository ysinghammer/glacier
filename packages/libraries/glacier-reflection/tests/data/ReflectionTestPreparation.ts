import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { DistributionContractPrepare } from "./DistributionContractPrepare.js";

/** Prepares genuine compiler and distribution inputs before Vitest starts isolated workers. */
class ReflectionTestPreparation {
  /** Rebuilds only owned generated inputs; tool failures retain their actual diagnostics. */
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

/** Vitest-owned global setup delegates input preparation, never launching another test runner. */
export default async function setup(): Promise<void> {
  await ReflectionTestPreparation.run();
}
