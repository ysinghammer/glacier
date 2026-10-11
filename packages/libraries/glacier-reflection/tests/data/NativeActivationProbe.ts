import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Runs only the three platform preconditions that would break Vitest's own Reflect.apply usage. */
export class NativeActivationProbe {
  /** Awaits native assertions and process exit; Vitest's V8 collector inherits and consumes real child coverage. */
  public static run(mode: "unavailable" | "null" | "throwing"): string {
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL("./ReflectActivationAssertions.ts", import.meta.url)), mode],
      { encoding: "utf8", timeout: 8_000, killSignal: "SIGKILL" },
    );
    const coverageDirectory = process.env.NODE_V8_COVERAGE;
    if (coverageDirectory !== undefined) {
      const retained = new URL(`../artifacts/activation-coverage/${mode}/`, import.meta.url);
      rmSync(retained, { recursive: true, force: true });
      mkdirSync(retained, { recursive: true });
      for (const filename of readdirSync(coverageDirectory)) {
        if (filename.endsWith(".json")) {
          cpSync(`${coverageDirectory}/${filename}`, new URL(filename, retained));
        }
      }
    }
    if (result.error !== undefined) throw result.error;
    if (result.status !== 0) {
      throw new Error(`Native activation assertions failed (${result.status}): ${result.stderr}`);
    }
    return result.stdout.trim();
  }
}
