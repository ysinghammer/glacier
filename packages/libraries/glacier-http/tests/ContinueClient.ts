import { request } from "node:http";

/** Real HTTP client that withholds the body until the server explicitly sends Continue. */
export class ContinueClient {
  /** Flushes headers only; rejected requests finish without the client ever sending body bytes. */
  public static send(
    port: number,
    path: string,
    body: string,
    headers: Readonly<Record<string, string>> = {},
  ): Promise<{ readonly status: number; readonly hasContinued: boolean; readonly body: string }> {
    return new Promise((resolve, reject) => {
      let hasContinued = false;
      const client = request(
        {
          host: "127.0.0.1",
          port,
          path,
          method: "POST",
          agent: false,
          headers: {
            Expect: "100-continue",
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
            ...headers,
          },
        },
        (response) => {
          let data = "";
          response.setEncoding("utf8");
          response.on("data", (chunk: string) => {
            data += chunk;
          });
          response.once("error", reject);
          response.once("end", () => {
            resolve({ status: Number(response.statusCode), hasContinued, body: data });
            client.destroy();
          });
        },
      );
      client.setTimeout(5000, () => client.destroy(new Error("Continue client timed out")));
      client.once("error", reject);
      client.once("continue", () => {
        hasContinued = true;
        client.end(body);
      });
      client.flushHeaders();
    });
  }
}
