/** Executes real ESM in isolated Node processes or disposable Chromium iframe realms. */
export class FreshCompilerRealm {
  /**
   * Bounds each resource, observes completion, and always releases test-owned resources.
   * Compiler-source complements native built probes with the same-origin Vite root in Chromium;
   * Node still executes the native built root. Both enter exclusively through the public barrel.
   */
  public static async run(
    mode: string,
    consumer: "compiler" | "compiler-source" | "distribution" = "compiler",
  ): Promise<unknown> {
    let rootUrl = new URL("../../dist/index.js", import.meta.url).href;
    let fixtureUrl = new URL("../artifacts/compiler/RecordedCompilerFixture.js", import.meta.url)
      .href;
    let probeUrl = new URL("../artifacts/compiler/CompilerContractProbe.js", import.meta.url).href;
    let duplicateUrl = new URL("../artifacts/t015/attempt1/duplicate/index.js", import.meta.url)
      .href;
    const distributionPath = "tests/artifacts/t017/attempt2/consumer";
    if (consumer === "distribution") {
      rootUrl = new URL(
        `../../${distributionPath}/node_modules/@glacier/reflection/dist/index.js`,
        import.meta.url,
      ).href;
      probeUrl = new URL(`../../${distributionPath}/DistributionContractProbe.js`, import.meta.url)
        .href;
    }
    if (typeof window !== "undefined") {
      const response = await fetch(
        new URL("../artifacts/t015/attempt1/server-address.json", import.meta.url),
      );
      if (!response.ok)
        throw new Error(`Fresh realm server address unavailable: ${response.status}`);
      const address: unknown = await response.json();
      if (
        address === null ||
        typeof address !== "object" ||
        !("url" in address) ||
        typeof address.url !== "string"
      )
        throw new Error("Invalid fresh realm server address");
      rootUrl = `${address.url}/dist/index.js`;
      fixtureUrl = `${address.url}/tests/artifacts/compiler/RecordedCompilerFixture.js`;
      probeUrl = `${address.url}/tests/artifacts/compiler/CompilerContractProbe.js`;
      duplicateUrl = `${address.url}/tests/artifacts/t015/attempt1/duplicate/index.js`;
      if (consumer === "compiler-source") {
        // Vitest's CDP provider keeps its own origin and uses that origin's exact transform/maps.
        rootUrl = new URL("../../index.ts", import.meta.url).href;
      }
      if (consumer === "distribution") {
        const preparation = await fetch(
          new URL("../artifacts/t017/attempt2/preparation.json", import.meta.url),
        );
        if (!preparation.ok) throw new Error("Distribution preparation is unavailable");
        const distribution: unknown = await preparation.json();
        if (
          distribution === null ||
          typeof distribution !== "object" ||
          !("rootEntry" in distribution) ||
          typeof distribution.rootEntry !== "string"
        )
          throw new Error("Distribution root export-map entry is unavailable");
        rootUrl = new URL(
          distribution.rootEntry,
          `${address.url}/${distributionPath}/node_modules/@glacier/reflection/`,
        ).href;
        probeUrl = `${address.url}/${distributionPath}/DistributionContractProbe.js`;
      }
    }
    const probeName =
      consumer === "distribution" ? "DistributionContractProbe" : "CompilerContractProbe";
    const expression = `const { ${probeName} } = await import(${JSON.stringify(probeUrl)});
const result = await ${probeName}.run(${JSON.stringify(mode)}, ${JSON.stringify(rootUrl)}, ${JSON.stringify(fixtureUrl)}, ${JSON.stringify(duplicateUrl)});`;
    if (typeof window === "undefined") {
      const { spawn } = await import("node:child_process");
      const child = spawn(
        process.execPath,
        [
          "--input-type=module",
          "--eval",
          `${expression}\nprocess.stdout.write(JSON.stringify(result));`,
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
      let timer: ReturnType<typeof setTimeout> | undefined;
      const completion = new Promise<void>((resolve, reject) => {
        child.once("error", reject);
        child.once("close", (code, signal) => {
          if (code === 0) resolve();
          else reject(new Error(`Fresh Node probe failed (${code}/${signal}): ${errors}`));
        });
        timer = setTimeout(() => {
          child.kill("SIGKILL");
          reject(new Error(`Fresh Node probe exceeded 8 seconds: ${errors}`));
        }, 8_000);
      });
      try {
        await completion;
        return JSON.parse(output);
      } finally {
        if (timer !== undefined) clearTimeout(timer);
        if (child.exitCode === null && child.signalCode === null) {
          const closed = new Promise<void>((resolve, reject) => {
            child.once("close", () => resolve());
            child.once("error", reject);
          });
          this.requireCleanup(child.kill("SIGKILL"), "Fresh Node cleanup failed");
          await closed;
        }
      }
    }
    const iframe = document.createElement("iframe");
    const requestId = crypto.randomUUID();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let listener: ((event: MessageEvent) => void) | undefined;
    try {
      const result = new Promise<unknown>((resolve, reject) => {
        listener = (event) => {
          if (event.source !== iframe.contentWindow || event.data?.requestId !== requestId) return;
          if (event.data.error !== undefined) reject(new Error(event.data.error));
          else resolve(event.data.result);
        };
        window.addEventListener("message", listener);
        timer = setTimeout(
          () => reject(new Error("Fresh Chromium realm exceeded 8 seconds")),
          8_000,
        );
        iframe.srcdoc = `<script type="importmap">${JSON.stringify({
          imports: { "@glacier/reflection": rootUrl },
        })}</script><script type="module">
try {
${expression}
parent.postMessage({ requestId: ${JSON.stringify(requestId)}, result }, "*");
} catch (error) {
parent.postMessage({ requestId: ${JSON.stringify(requestId)}, error: String(error?.stack ?? error) }, "*");
}
</script>`;
        document.body.append(iframe);
      });
      return await result;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      if (listener !== undefined) window.removeEventListener("message", listener);
      iframe.remove();
      this.requireCleanup(!iframe.isConnected, "Fresh Chromium realm cleanup failed");
    }
  }

  /** Cleanup failures must be observable rather than silently discarded. */
  private static requireCleanup(isComplete: boolean, message: string): void {
    if (!isComplete) throw new Error(message);
  }
}
