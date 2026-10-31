import { describe, expect, it } from "vitest";
import { once } from "node:events";
import { createConnection } from "node:net";
import { ApiGet, ApiPost, ApiBody, ApiRequest, HttpResponse } from "../../../index.js";
import type { HttpRequest, IHttpResponseLogRecord } from "../../../index.js";
import { LoopbackClient } from "../../LoopbackClient.js";
import { Deferred } from "../../Deferred.js";
import { EndpointDeclarations } from "../../EndpointDeclarations.js";
import { TextDto } from "../../data/TextDto.js";

describe("receive deadlines, cooperative cancellation and safe keep-alive framing", () => {
  it("partial headers time out without hooks or a fabricated normalized identity", async () => {
    let calls = 0;
    const fixture = await LoopbackClient.start({
      limits: { headersTimeoutMs: 40, requestTimeoutMs: 80 },
      onResponseLog: () => {
        calls++;
      },
    });
    try {
      const response = await LoopbackClient.raw(fixture.port, "GET /echo HTTP/1.1\r\nHost:");
      expect(response.status).toBe(408);
      expect(response.fields["x-request-id"]).toBeUndefined();
      expect(calls).toBe(0);
    } finally {
      await fixture.server.close();
    }
  });

  it("a receive deadline is not a controller deadline; disconnect signals reach an invoked controller", async () => {
    const entered = new Deferred<HttpRequest>();
    const release = new Deferred<void>();
    /** Consumer work cooperates with request cancellation and remains application-owned. */
    class Controller {
      /**
       * Waits for application release after the request is invoked.
       * @param request Server-created request whose abort signal is observed by the scenario.
       * @returns Promise fulfilled with no value after release resolves.
       */
      public async value(request: HttpRequest): Promise<void> {
        entered.resolve(request);
        await release.promise;
      }
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "value", ApiGet("/slow"));
    ApiRequest()(Controller.prototype, "value", 0);
    const fixture = await LoopbackClient.start({
      controllers: [new Controller()],
      limits: { headersTimeoutMs: 40, requestTimeoutMs: 80 },
    });
    const socket = createConnection({ host: "127.0.0.1", port: fixture.port });
    try {
      await once(socket, "connect");
      socket.write("GET /slow HTTP/1.1\r\nHost: localhost\r\n\r\n");
      const request = await entered.promise;
      // A separate incomplete upload actually expires: no sleep/fake clock is used as readiness.
      expect(
        (
          await LoopbackClient.raw(
            fixture.port,
            "GET /slow HTTP/1.1\r\nHost: localhost\r\nContent-Length: 5\r\n",
          )
        ).status,
      ).toBe(408);
      expect(request.signal.aborted).toBe(false);
      const aborted = once(request.signal, "abort");
      socket.destroy();
      await aborted;
      expect(request.signal.aborted).toBe(true);
    } finally {
      socket.destroy();
      release.resolve();
      await fixture.server.close();
    }
  });

  it("incomplete body receive closure signals authentication's normalized request and records disconnection", async () => {
    const entered = new Deferred<HttpRequest>();
    const logged = new Deferred<IHttpResponseLogRecord>();
    /** A body route must not be invoked for an incomplete framed object. */
    class Controller {
      /**
       * Echoes a fully parsed text DTO as a JSON response.
       * @param body Validated request body DTO.
       * @returns JSON response carrying the body DTO.
       */
      public value(body: TextDto): HttpResponse<TextDto> {
        return HttpResponse.json(body);
      }
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "value", ApiPost("/body"), {
      status: 200,
      type: TextDto,
    });
    ApiBody(TextDto)(Controller.prototype, "value", 0);
    const fixture = await LoopbackClient.start({
      controllers: [new Controller()],
      limits: { requestTimeoutMs: 60 },
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: (request) => {
          entered.resolve(request);
          return "actor";
        },
      },
      onResponseLog: (record) => {
        logged.resolve(record);
      },
    });
    try {
      const response = LoopbackClient.raw(
        fixture.port,
        "POST /body HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: 100\r\n\r\n{",
      );
      const request = await entered.promise;
      const aborted = once(request.signal, "abort");
      await response;
      await aborted;
      expect(await logged.promise).toMatchObject({
        requestId: request.requestId,
        bodyBytes: 0,
        outcome: "disconnected",
      });
    } finally {
      await fixture.server.close();
    }
  });

  it.each([
    "Content-Length: 1\r\n\r\nx",
    "Transfer-Encoding: chunked\r\n\r\n1\r\nx\r\n0\r\n\r\n",
    "Transfer-Encoding: gzip, chunked\r\n\r\n0\r\n\r\n",
    "Content-Length: 999\r\n\r\nx",
  ])(
    "rejected unread bodies close rather than executing a pipelined successor: %s",
    async (body) => {
      let authCalls = 0;
      const fixture = await LoopbackClient.start({
        limits: { bodyBytes: 8 },
        authentication: {
          challenge: { scheme: "Bearer" },
          authenticate: () => {
            authCalls++;
            return "actor";
          },
        },
      });
      try {
        const response = await LoopbackClient.raw(
          fixture.port,
          `GET /echo HTTP/1.1\r\nHost: localhost\r\n${body}GET /echo HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n`,
        );
        expect([400, 413]).toContain(response.status);
        expect(response.fields["connection"]).toEqual(["close"]);
        expect(response.raw).not.toContain("204 No Content");
        expect(authCalls).toBeLessThanOrEqual(1);
        expect((await LoopbackClient.send(fixture.port)).status).toBe(204);
      } finally {
        await fixture.server.close();
      }
    },
  );

  it("consumed schema-invalid bodies preserve valid next-request framing on the same socket", async () => {
    /** Fully consumed schema rejections may safely keep the connection alive. */
    class Controller {
      /**
       * Echoes a fully parsed text DTO as a JSON response.
       * @param body Validated request body DTO.
       * @returns JSON response carrying the body DTO.
       */
      public value(body: TextDto): HttpResponse<TextDto> {
        return HttpResponse.json(body);
      }
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "value", ApiPost("/body"), {
      status: 200,
      type: TextDto,
    });
    ApiBody(TextDto)(Controller.prototype, "value", 0);
    const fixture = await LoopbackClient.start({ controllers: [new Controller()] });
    try {
      const second = JSON.stringify({ text: "second" });
      const response = await LoopbackClient.raw(
        fixture.port,
        `POST /body HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: 2\r\n\r\n{}POST /body HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(second)}\r\n\r\n${second}`,
      );
      expect(response.status).toBe(400);
      expect(response.raw.match(/HTTP\/1.1 /g)).toHaveLength(2);
      expect(response.raw).toContain("HTTP/1.1 200 OK");
      expect(response.raw).toContain(second);
    } finally {
      await fixture.server.close();
    }
  });

  it("a parser error after a valid keep-alive response closes transport without appending another status into response framing", async () => {
    const fixture = await LoopbackClient.start();
    const socket = createConnection({ host: "127.0.0.1", port: fixture.port });
    const received = new Deferred<void>();
    let data = "";
    socket.setEncoding("utf8");
    socket.on("data", (chunk: string) => {
      data += chunk;
      if (data.includes("\r\n\r\n")) received.resolve();
    });
    try {
      await once(socket, "connect");
      socket.write("GET /echo HTTP/1.1\r\nHost: localhost\r\n\r\n");
      await received.promise;
      expect(data).toContain("HTTP/1.1 204 No Content");
      const closed = once(socket, "close");
      socket.write("GET /echo HTTP/1.1\r\nHost: localhost\r\nContent-Length: -1\r\n\r\n");
      await closed;
      expect(data.match(/HTTP\/1.1 /g)).toHaveLength(1);
      expect((await LoopbackClient.send(fixture.port)).status).toBe(204);
    } finally {
      socket.destroy();
      await fixture.server.close();
    }
  });
});
