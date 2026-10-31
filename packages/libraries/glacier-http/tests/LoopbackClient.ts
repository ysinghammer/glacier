import { createConnection } from "node:net";
import { HttpServer } from "../index.js";
import type { IHttpServerOptions } from "../index.js";
import { PrimitiveController } from "./data/PrimitiveController.js";

/** Real loopback transport helper, with no production construction/inspection escape hatch. */
export class LoopbackClient {
  /**
   * Starts an ephemeral HTTP server with a public test controller and returns its bound port.
   * @param options Public server options overriding defaults; defaults to empty options.
   * @returns Promise fulfilled with the server, ephemeral port, and controller.
   * @throws {Error} Promise rejects when the server exposes no listening address.
   */
  public static async start(options: Partial<IHttpServerOptions> = {}): Promise<{
    readonly server: HttpServer;
    readonly port: number;
    readonly controller: PrimitiveController;
  }> {
    const controller = new PrimitiveController();
    const server = HttpServer.create({ controllers: [controller], onError: () => {}, ...options });
    await server.listen({ host: "127.0.0.1", port: 0 });
    const address = server.address();
    if (address === undefined) throw new Error("Missing loopback listener");
    return { server, port: address.port, controller };
  }

  /**
   * Sends a complete HTTP/1.1 request over a real loopback socket.
   * @param port Listening loopback port.
   * @param target Origin-form request target; defaults to `/echo`.
   * @param headers Raw header lines, including any repeated fields.
   * @param method Request method; defaults to `GET`.
   * @returns Promise fulfilled with the response; transport errors reject it.
   */
  public static async send(
    port: number,
    target = "/echo",
    headers: readonly string[] = [],
    method = "GET",
  ): Promise<IWireResponse> {
    return LoopbackClient.raw(
      port,
      `${method} ${target} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n${headers.length === 0 ? "" : `${headers.join("\r\n")}\r\n`}\r\n`,
    );
  }

  /**
   * Sends caller-supplied HTTP framing through an actual loopback socket.
   * @param port Listening loopback port.
   * @param wire Complete raw request bytes represented as a string.
   * @returns Promise fulfilled with the response; socket errors reject it.
   */
  public static async raw(port: number, wire: string): Promise<IWireResponse> {
    const data = await new Promise<string>((resolve, reject) => {
      const socket = createConnection({ host: "127.0.0.1", port });
      let data = "";
      socket.setEncoding("utf8");
      socket.setTimeout(5000, () => socket.destroy(new Error("Loopback timeout")));
      socket.once("connect", () => socket.write(wire));
      socket.on("data", (chunk: string) => {
        data += chunk;
      });
      socket.once("error", reject);
      socket.once("end", () => resolve(data));
    });
    const separator = data.indexOf("\r\n\r\n");
    const lines = data.slice(0, separator).split("\r\n");
    const statusLine = lines.shift();
    const fields: Record<string, string[]> = {};
    for (const line of lines) {
      const index = line.indexOf(":");
      const name = line.slice(0, index).toLowerCase();
      fields[name] = [...(fields[name] ?? []), line.slice(index + 1).trim()];
    }
    return {
      status: Number(statusLine?.split(" ")[1]),
      fields,
      body: data.slice(separator + 4),
      raw: data,
    };
  }
}

/** Complete client-observed response retained by loopback transport assertions. */
export interface IWireResponse {
  /** Read-only numeric HTTP status parsed from the response status line. */
  readonly status: number;
  /** Read-only lowercase header map preserving all values in wire order. */
  readonly fields: Readonly<Record<string, readonly string[]>>;
  /** Read-only response body decoded as UTF-8 after the header separator. */
  readonly body: string;
  /** Read-only complete response decoded as UTF-8, including headers. */
  readonly raw: string;
}
