import { request } from "node:http";

/** Real HTTP client that withholds the body until the server explicitly sends Continue. */
export class ContinueClient {
  /**
   * Waits for `100 Continue` before sending a POST body to a real listener.
   * @param port Listening loopback port.
   * @param path Request path sent in the POST line.
   * @param body UTF-8 request body sent only after Continue.
   * @param headers Additional request headers; defaults to none.
   * @returns Promise fulfilled with the response; socket errors and timeout reject it.
   */
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
