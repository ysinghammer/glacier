import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

/** Serves built ESM untransformed, avoiding the parent Vitest module runner in fresh realms. */
class CompilerRealmServer {
  /** Starts a loopback-only, CORS-enabled fixture distribution server; parent owns its lifetime. */
  public static start(): void {
    const base = resolve(import.meta.dirname, "../..");
    const allowed = [
      resolve(base, "dist") + sep,
      resolve(base, "tests/artifacts/compiler") + sep,
      resolve(base, "tests/artifacts/t015/attempt1/duplicate") + sep,
      resolve(base, "tests/artifacts/t017/attempt2/consumer") + sep,
    ];
    const server = createServer(async (request, response) => {
      try {
        const path = resolve(base, "." + new URL(request.url ?? "/", "http://localhost").pathname);
        if (!allowed.some((prefix) => path.startsWith(prefix)) || !path.endsWith(".js")) {
          response.writeHead(404).end();
          return;
        }
        const content = await readFile(path);
        response
          .writeHead(200, {
            "content-type": "text/javascript",
            "access-control-allow-origin": "*",
          })
          .end(content);
      } catch (error) {
        response.writeHead(500).end(String(error));
      }
    });
    server.on("error", (error) => {
      throw error;
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string")
        throw new Error("No fixture server address");
      process.send?.({ url: `http://127.0.0.1:${address.port}` });
    });
  }
}

CompilerRealmServer.start();
