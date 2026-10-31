import type { HttpServer } from "@glacier/http";
import type { BenchmarkWorkload } from "./BenchmarkWorkload.js";

/** Test-owned IPC lifecycle shared by the Glacier and temporary Express server processes. */
export class BenchmarkServerProcess {
  /** Publishes a ready port only after listen; supervises stats/stop and observable cleanup. */
  public static async serve(
    server: Pick<HttpServer, "listen" | "address" | "close">,
    workload: BenchmarkWorkload,
  ): Promise<void> {
    await server.listen({ host: "127.0.0.1", port: 0 });
    const address = server.address();
    if (address === undefined || process.send === undefined) {
      await server.close();
      throw new Error("Benchmark server requires IPC and a listener");
    }
    process.send({ port: address.port });
    try {
      await new Promise<void>((resolve, reject) => {
        process.on("message", (message: unknown) => {
          if (message === "stats") process.send?.(workload.snapshot());
          else if (message === "stop") resolve();
          else reject(new Error("Unknown benchmark command"));
        });
        process.once("disconnect", resolve);
      });
    } finally {
      await server.close();
      process.disconnect();
    }
  }
}
