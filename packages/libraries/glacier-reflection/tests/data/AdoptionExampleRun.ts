import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { chromium } from "playwright";

/** Executes the checked documentation in independent native Node and Chromium module realms. */
class AdoptionExampleRun {
  /** Bounds asynchronous observation/cleanup without swallowing its original failure. */
  private static async bounded<T>(operation: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("Example operation exceeded 8 seconds")),
            8_000,
          );
        }),
      ]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }

  /** Serves only generated JS, awaits real readiness, and closes every owned resource. */
  public static async run(): Promise<void> {
    const base = resolve(import.meta.dirname, "../..");
    const node = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        'const { AdoptionExample } = await import("./tests/artifacts/compiler/AdoptionExample.js"); process.stdout.write(JSON.stringify({ checks: AdoptionExample.run() }));',
      ],
      { cwd: base, encoding: "utf8", timeout: 8_000 },
    );
    if (node.error !== undefined) throw node.error;
    if (node.status !== 0) throw new Error(node.stderr);
    const allowed = [resolve(base, "dist") + sep, resolve(base, "tests/artifacts/compiler") + sep];
    const server = createServer(async (request, response) => {
      try {
        const path = resolve(base, "." + new URL(request.url ?? "/", "http://localhost").pathname);
        if (!allowed.some((prefix) => path.startsWith(prefix)) || !path.endsWith(".js")) {
          response.writeHead(404).end();
          return;
        }
        response
          .writeHead(200, { "content-type": "text/javascript", "access-control-allow-origin": "*" })
          .end(await readFile(path));
      } catch (error) {
        response.writeHead(500).end(String(error));
      }
    });
    await new Promise<void>((resolveReady, reject) => {
      const timer = setTimeout(() => {
        server.close();
        reject(new Error("Example server startup exceeded 8 seconds"));
      }, 8_000);
      server.once("listening", () => clearTimeout(timer));
      server.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      server.listen(0, "127.0.0.1", resolveReady);
    });
    try {
      const address = server.address();
      if (address === null || typeof address === "string")
        throw new Error("No example server address");
      const url = `http://127.0.0.1:${address.port}`;
      const ready = await fetch(`${url}/dist/index.js`, { signal: AbortSignal.timeout(8_000) });
      if (!ready.ok) throw new Error(`Example readiness failed: ${ready.status}`);
      const browser = await chromium.launch({ headless: true, timeout: 8_000 });
      try {
        const page = await browser.newPage();
        page.setDefaultTimeout(8_000);
        await page.setContent(
          `<script type="importmap">${JSON.stringify({ imports: { "@glacier/reflection": `${url}/dist/index.js` } })}</script>`,
        );
        const browserChecks = await this.bounded(
          page.evaluate(async (moduleUrl) => {
            const module: unknown = await import(moduleUrl);
            if (module === null || typeof module !== "object" || !("AdoptionExample" in module))
              throw new Error("Example class unavailable");
            const example = module.AdoptionExample;
            if (
              typeof example !== "function" ||
              !("run" in example) ||
              typeof example.run !== "function"
            )
              throw new Error("Example entry unavailable");
            const count: unknown = example.run();
            if (typeof count !== "number" || count <= 0)
              throw new Error("Invalid example check count");
            return count;
          }, `${url}/tests/artifacts/compiler/AdoptionExample.js`),
        );
        const output = {
          node: process.version,
          nodeResult: JSON.parse(node.stdout),
          chromium: browser.version(),
          browserChecks,
        };
        await mkdir(new URL("../artifacts/t018/attempt1/", import.meta.url), { recursive: true });
        await writeFile(
          new URL("../artifacts/t018/attempt1/examples.json", import.meta.url),
          JSON.stringify(output, null, 2),
        );
        process.stdout.write(JSON.stringify(output) + "\n");
      } finally {
        await this.bounded(browser.close());
      }
    } finally {
      await this.bounded(
        new Promise<void>((resolveClosed, reject) =>
          server.close((error) => (error === undefined ? resolveClosed() : reject(error))),
        ),
      );
    }
  }
}

await AdoptionExampleRun.run();
