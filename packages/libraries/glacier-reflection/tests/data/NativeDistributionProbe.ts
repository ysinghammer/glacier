import { spawn } from "node:child_process";

/** Observes copied public generated consumers in fresh bounded native Node processes. */
export class NativeDistributionProbe {
  /** Awaits JSON observations and child closure, propagating tool, execution and timeout failures. */
  public static async run(mode: string): Promise<unknown> {
    const probe = new URL(
      "../artifacts/distribution/consumer/DistributionContractProbe.js",
      import.meta.url,
    );
    const child = spawn(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `const { DistributionContractProbe } = await import(${JSON.stringify(probe.href)});
process.stdout.write(JSON.stringify(await DistributionContractProbe.run(${JSON.stringify(mode)})));`,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let output = "";
    let errors = "";
    child.stdout.setEncoding("utf8").on("data", (value: string) => {
      output += value;
    });
    child.stderr.setEncoding("utf8").on("data", (value: string) => {
      errors += value;
    });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, 8_000);
    try {
      await new Promise<void>((resolve, reject) => {
        child.once("error", reject);
        child.once("close", (code, signal) => {
          if (!timedOut && code === 0) resolve();
          else
            reject(
              new Error(
                `Native distribution probe failed (${code}/${signal}, timeout=${timedOut}): ${errors}`,
              ),
            );
        });
      });
      const result: unknown = JSON.parse(output);
      return result;
    } finally {
      clearTimeout(timer);
      if (child.exitCode === null && child.signalCode === null) {
        await new Promise<void>((resolve, reject) => {
          child.once("close", () => resolve());
          child.once("error", reject);
          if (!child.kill("SIGKILL")) reject(new Error("Native probe cleanup failed"));
        });
      }
    }
  }
}
