import { fork, spawn, type ChildProcess } from "node:child_process";
import { writeFile, rm, cp } from "node:fs/promises";

/** Invocation owner for fresh native Chromium module delivery and real Vitest execution. */
class CompilerContractRun {
  /** Awaits a specific child exit with a finite bound and observable failures. */
  private static closed(child: ChildProcess): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("Child cleanup exceeded 8 seconds"));
      }, 8_000);
      child.once("close", () => {
        clearTimeout(timer);
        resolve();
      });
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /** Starts a real server, records readiness, runs requested Vitest selectors, and releases it in finally. */
  public static async run(): Promise<void> {
    const addressFile = new URL("../artifacts/t015/attempt1/server-address.json", import.meta.url);
    const server = fork(new URL("./CompilerRealmServer.ts", import.meta.url), [], {
      stdio: ["ignore", "inherit", "inherit", "ipc"],
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    let runner: ChildProcess | undefined;
    try {
      const duplicate = new URL("../artifacts/t015/attempt1/duplicate/", import.meta.url);
      await rm(duplicate, { recursive: true, force: true });
      await cp(new URL("../../dist/", import.meta.url), duplicate, { recursive: true });
      const url = await new Promise<string>((resolve, reject) => {
        server.once("error", reject);
        server.once("exit", (code) =>
          reject(new Error(`Fixture server exited before readiness: ${code}`)),
        );
        server.once("message", (message: unknown) => {
          if (
            message === null ||
            typeof message !== "object" ||
            !("url" in message) ||
            typeof message.url !== "string"
          )
            reject(new Error("Invalid fixture server readiness"));
          else resolve(message.url);
        });
        timer = setTimeout(
          () => reject(new Error("Fixture server startup exceeded 8 seconds")),
          8_000,
        );
      });
      if (timer !== undefined) clearTimeout(timer);
      const ready = await fetch(`${url}/dist/index.js`, { signal: AbortSignal.timeout(8_000) });
      if (!ready.ok) throw new Error(`Fixture server readiness failed: ${ready.status}`);
      await writeFile(addressFile, JSON.stringify({ url }));
      const child = spawn("pnpm", ["exec", "vitest", "run", ...process.argv.slice(2)], {
        stdio: "inherit",
        cwd: new URL("../..", import.meta.url),
      });
      runner = child;
      const exitCode = await new Promise<number>((resolve, reject) => {
        const executionTimer = setTimeout(() => {
          child.kill("SIGKILL");
          reject(new Error("Vitest execution exceeded 120 seconds"));
        }, 120_000);
        child.once("error", (error) => {
          clearTimeout(executionTimer);
          reject(error);
        });
        child.once("close", (code) => {
          clearTimeout(executionTimer);
          resolve(code ?? 1);
        });
      });
      process.exitCode = exitCode;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      if (runner !== undefined && runner.exitCode === null && runner.signalCode === null) {
        const runnerClosed = this.closed(runner);
        runner.kill("SIGKILL");
        await runnerClosed;
      }
      const closed = this.closed(server);
      server.kill("SIGTERM");
      await closed;
      await rm(addressFile, { force: true });
    }
  }
}

await CompilerContractRun.run();
