import { describe, expect, it } from "vitest";
import { HttpRequest } from "../../../index.js";
import { LoopbackClient } from "../../LoopbackClient.js";

/** Test-owned observer using only the approved authentication hook and real HTTP. */
class RequestObservation {
  /**
   * Captures a normalized server-created request through the public authentication hook.
   * @param target Request target sent by the loopback client.
   * @param headers Raw request headers; defaults to none.
   * @returns Promise fulfilled with the observed request after HTTP 204.
   * @throws {Error} Promise rejects when authentication observes no request.
   */
  public static async capture(
    target: string,
    headers: readonly string[] = [],
  ): Promise<HttpRequest> {
    let observed: HttpRequest | undefined;
    const fixture = await LoopbackClient.start({
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: (request) => {
          observed = request;
          return "actor";
        },
      },
    });
    try {
      expect((await LoopbackClient.send(fixture.port, target, headers)).status).toBe(204);
      if (observed === undefined) throw new Error("Authentication did not observe a request");
      return observed;
    } finally {
      await fixture.server.close();
    }
  }
}

describe("normalized readonly requests through the approved auth hook", () => {
  it("keeps credential-bearing lookups opaque while preserving authorized lookup and receiver checks", async () => {
    const request = await RequestObservation.capture("/echo", [
      "Authorization: Bearer synthetic-header-secret",
      "Cookie: session=synthetic-cookie-secret",
    ]);
    expect(request.headers.get("authorization")).toBe("Bearer synthetic-header-secret");
    expect(request.cookies.get("session")).toBe("synthetic-cookie-secret");
    expect(JSON.stringify({ headers: request.headers, cookies: request.cookies })).toBe(
      '{"headers":{},"cookies":{}}',
    );
    expect({ ...request.headers, ...request.cookies }).toEqual({});
    expect(JSON.stringify(request)).not.toContain("synthetic-");
    const borrowedHeaders: unknown = Object.create(request.headers);
    const borrowedCookies: unknown = Object.create(request.cookies);
    expect(() => request.headers.get.call(borrowedHeaders, "authorization")).toThrow(TypeError);
    expect(() => request.cookies.get.call(borrowedCookies, "session")).toThrow(TypeError);
  });

  it("rejects untyped direct request construction without a server-owned construction token", () => {
    expect(() => Reflect.construct(HttpRequest, [{}])).toThrow("server-created");
  });
  it("preserves identity, case, header occurrences, opaque cookies and detached readonly query/params", async () => {
    const request = await RequestObservation.capture(
      "/Echo?filter[name]=Ada+Lovelace&filter[tags]=node&filter[tags]=ts&filter[tags]=http&empty&x=a=b",
      [
        "Accept: application/json",
        "aCcEpT: text/plain",
        "X-One: one",
        "Cookie: empty=; opaque=a%20+b==",
        "Cookie: second=two",
        "X-Request-Id: caller-chosen",
      ],
    );
    expect(request).toBeInstanceOf(HttpRequest);
    expect(request.method).toBe("GET");
    expect(request.pathname).toBe("/Echo");
    expect(request.route).toBe("/:id");
    expect(request.params).toEqual({ id: "Echo" });
    expect(request.query).toEqual({
      filter: { name: "Ada Lovelace", tags: ["node", "ts", "http"] },
      empty: "",
      x: "a=b",
    });
    expect(request.url).toContain("filter[name]");
    expect(request.remoteAddress).toBe("127.0.0.1");
    expect(request.signal).toBeInstanceOf(AbortSignal);
    expect(request.signal.aborted).toBe(false);
    expect(request.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(request.requestId).not.toBe("caller-chosen");
    expect(request.headers.get("ACCEPT")).toBe("application/json, text/plain");
    expect(request.headers.getAll("accept")).toEqual(["application/json", "text/plain"]);
    expect(request.headers.get("x-one")).toBe("one");
    expect(request.headers.get("missing")).toBeUndefined();
    expect(request.headers.getAll("missing")).toEqual([]);
    expect(request.headers.get("Cookie")).toBe("empty=; opaque=a%20+b==; second=two");
    expect(request.cookies.get("empty")).toBe("");
    expect(request.cookies.get("opaque")).toBe("a%20+b==");
    expect(request.cookies.get("second")).toBe("two");
    expect(request.cookies.get("Missing")).toBeUndefined();
    expect(Object.isFrozen(request)).toBe(true);
    expect(Object.isFrozen(request.params)).toBe(true);
    expect(Object.isFrozen(request.query)).toBe(true);
    expect(Object.isFrozen(request.query["filter"])).toBe(true);
    const filter: unknown = Reflect.get(request.query, "filter");
    if (typeof filter !== "object" || filter === null) throw new Error("Missing observed filter");
    const tags: unknown = Reflect.get(filter, "tags");
    if (!Array.isArray(tags)) throw new Error("Missing observed tags");
    expect(Object.isFrozen(tags)).toBe(true);
    expect(Reflect.set(tags, "0", "changed")).toBe(false);
    expect(tags).toEqual(["node", "ts", "http"]);
    expect(Object.isFrozen(request.headers.getAll("accept"))).toBe(true);
    expect(Object.isFrozen(request.headers.getAll("missing"))).toBe(true);
    expect(Reflect.set(request, "pathname", "/changed")).toBe(false);
    expect(Reflect.set(request.params, "id", "changed")).toBe(false);
    expect(Reflect.set(request.query, "empty", "changed")).toBe(false);
    expect(Reflect.set(request.headers.getAll("accept"), "0", "changed")).toBe(false);
    expect(request.headers.getAll("accept")[0]).toBe("application/json");
    expect(request.cookies.get("opaque")).toBe("a%20+b==");
    expect("socket" in request).toBe(false);
    expect("body" in request).toBe(false);
  });

  it("decodes once, preserves slashes and supports nested singleton/scalar-array syntax", async () => {
    expect((await RequestObservation.capture("/a//b?")).pathname).toBe("/a//b");
    expect((await RequestObservation.capture("/echo/")).pathname).toBe("/echo/");
    expect((await RequestObservation.capture("/A%252f")).params).toEqual({ id: "A%2f" });
    expect((await RequestObservation.capture("/%E2%82%AC")).pathname).toBe("/€");
    expect(
      (
        await RequestObservation.capture(
          "/echo?tags=node&tags=ts&f[a][b]=%E2%82%AC&f[a][c]=%2B&encoded%5Bkey%5D=yes",
        )
      ).query,
    ).toEqual({ tags: ["node", "ts"], f: { a: { b: "€", c: "+" } }, encoded: { key: "yes" } });
    expect((await RequestObservation.capture("/")).params).toEqual({});
    expect((await RequestObservation.capture("/echo?123=x&a[b][c][d][e]=five")).query).toEqual({
      "123": "x",
      a: { b: { c: { d: { e: "five" } } } },
    });
    const fields = await RequestObservation.capture("/echo", [
      "X-Opaque: first",
      "X-Opaque: second",
      'Cookie: quoted="opaque"',
    ]);
    expect(fields.headers.get("X-Opaque")).toBe("first");
    expect(fields.headers.getAll("X-Opaque")).toEqual(["first", "second"]);
    expect(fields.cookies.get("quoted")).toBe('"opaque"');
  });

  it.each([
    "/echo?tags[]=x",
    "/echo?tags[0]=x",
    "/echo?a.b=x",
    "/echo?a[b.c]=x",
    "/echo?=x",
    "/echo?a=x&a[b]=y",
    "/echo?a=x&a=y&a[b]=z",
    "/echo?a[b]=x&a=y",
    "/echo?__proto__=x",
    "/echo?a[prototype]=x",
    "/echo?a[constructor]=x",
    "/echo?a[b][c][d][e][f]=x",
    `/echo?${Array.from({ length: 101 }, (_, index) => `a${index}=x`).join("&")}`,
    "/echo?bad%=x",
    "/é",
    "/echo?a=%",
    "/echo?a=%C0%AF",
    "/echo?%ED%A0%80=x",
    "/a%2fb",
    "/a%5cb",
    "/%00",
    "/%1f",
    "/%7f",
    "/%2e",
    "/%2e%2e",
    "/a/../b",
    "/a/./b",
    "/%",
    "/%FF",
    "/%ED%A0%80",
    "/echo#fragment",
    "http://example.com/echo",
    "*",
  ])("rejects unsafe/unsupported target %s before authentication", async (target) => {
    let calls = 0;
    let diagnostics = 0;
    const fixture = await LoopbackClient.start({
      onError: () => {
        diagnostics++;
      },
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: () => {
          calls++;
          return "actor";
        },
      },
    });
    try {
      const result = await LoopbackClient.send(fixture.port, target);
      expect(result.status).toBe(400);
      expect(calls).toBe(0);
      expect(diagnostics).toBe(0);
      expect(result.body).not.toContain(target);
    } finally {
      await fixture.server.close();
    }
  });

  it("rejects bounded targets and retains Node's strict framing parser", async () => {
    const fixture = await LoopbackClient.start();
    try {
      expect((await LoopbackClient.send(fixture.port, `/${"a".repeat(8192)}`)).status).toBe(414);
      expect(
        (
          await LoopbackClient.raw(
            fixture.port,
            "GET /echo HTTP/1.1\r\nHost: localhost\r\nContent-Length: 0\r\nContent-Length: 1\r\nConnection: close\r\n\r\n",
          )
        ).status,
      ).toBe(400);
      expect(
        (
          await LoopbackClient.raw(
            fixture.port,
            "GET /echo HTTP/1.1\r\nHost: localhost\r\nContent-Length: 0\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n",
          )
        ).status,
      ).toBe(400);
    } finally {
      await fixture.server.close();
    }
  });
  it.each(["Authorization", "Proxy-Authorization", "Host", "Content-Type", "Expect"])(
    "rejects duplicate sensitive %s before Node normalization hides it",
    async (name) => {
      const fixture = await LoopbackClient.start();
      try {
        const value = name === "Expect" ? "anything" : "value";
        const result = await LoopbackClient.send(fixture.port, "/echo", [
          `${name}: ${value}`,
          `${name.toLowerCase()}: ${value}`,
        ]);
        expect([400, 417]).toContain(result.status);
      } finally {
        await fixture.server.close();
      }
    },
  );
  it.each([
    "duplicate=one; duplicate=two",
    "empty=; empty=other",
    "broken",
    "=value",
    "bad name=value",
    "name=a b",
    'name=a"quoted"',
    "name=v;",
  ])("rejects malformed/duplicate cookie %s", async (cookie) => {
    const fixture = await LoopbackClient.start();
    try {
      expect((await LoopbackClient.send(fixture.port, "/echo", [`Cookie: ${cookie}`])).status).toBe(
        400,
      );
    } finally {
      await fixture.server.close();
    }
  });
  it("rejects duplicate names across Cookie fields and emits independently generated response IDs", async () => {
    let observed: HttpRequest | undefined;
    const fixture = await LoopbackClient.start({
      authentication: {
        challenge: { scheme: "Bearer" },
        authenticate: (request) => {
          observed = request;
          return "actor";
        },
      },
    });
    try {
      expect(
        (await LoopbackClient.send(fixture.port, "/echo", ["Cookie: name=a", "Cookie: name=b"]))
          .status,
      ).toBe(400);
      const first = await LoopbackClient.send(fixture.port, "/echo", ["X-Request-Id: untrusted"]);
      expect(first.fields["x-request-id"]).toEqual([observed?.requestId]);
      expect((await LoopbackClient.send(fixture.port)).fields["x-request-id"]).not.toEqual(
        first.fields["x-request-id"],
      );
    } finally {
      await fixture.server.close();
    }
  });
});
