import { describe, expect, it } from "vitest";
import { HttpResponse, HttpCookie } from "../../../index.js";
import { LoopbackClient } from "../../LoopbackClient.js";
import { inspect } from "node:util";

describe("success response transport values", () => {
  it("keeps cookie credentials, unprojected DTO values, and transport fields out of public output", () => {
    const cookie = HttpCookie.set("session", "synthetic-cookie-secret");
    const response = HttpResponse.json(
      { text: "public", credential: "synthetic-dto-secret" },
      { cookies: [cookie], headers: { "Set-Cookie": "manual=synthetic-header-secret" } },
    );
    expect(JSON.stringify({ cookie, response })).toBe('{"cookie":{},"response":{}}');
    expect({ ...cookie, ...response }).toEqual({});
    expect(inspect({ cookie, response })).not.toContain("synthetic-");
    expect(Object.isFrozen(cookie)).toBe(true);
    expect(Object.isFrozen(response)).toBe(true);
  });

  it("rejects inherited response envelopes through real HTTP without emitting their DTO or headers", async () => {
    const fixture = await LoopbackClient.start();
    try {
      const response = HttpResponse.json(
        { text: "synthetic-dto-secret" },
        { headers: { "X-Private": "synthetic-header-secret" } },
      );
      fixture.controller.jsonResponse = Object.create(response);
      const result = await LoopbackClient.send(fixture.port, "/json");
      expect(result.status).toBe(500);
      expect(result.body).not.toContain("synthetic-");
      expect(result.fields["x-private"]).toBeUndefined();
    } finally {
      await fixture.server.close();
    }
  });

  it("rejects untyped direct construction instead of allowing private-factory bypass", () => {
    expect(() =>
      Reflect.apply(HttpResponse.noContent, HttpResponse, [{ headers: null }]),
    ).toThrow();
    expect(() =>
      Reflect.apply(HttpResponse.noContent, HttpResponse, [{ cookies: null }]),
    ).toThrow();
    expect(() => Reflect.construct(HttpResponse, [{}, 500, {}])).toThrow("factories");
    expect(() => Reflect.construct(HttpCookie, ["name=bad\r\nfield"])).toThrow("factories");
    expect(() =>
      HttpResponse.noContent({ cookies: [Object.create(HttpCookie.prototype)] }),
    ).toThrow();
  });
  it("snapshots header/cookie containers and emits a bodyless success on real HTTP", async () => {
    const fixture = await LoopbackClient.start();
    try {
      const fields = ["first", "second"];
      const cookies = [HttpCookie.set("session", "opaque")];
      const headers = { "X-Values": fields, "Set-Cookie": "manual=value", "X-Single": "one" };
      fixture.controller.response = HttpResponse.noContent({ headers, cookies });
      fields.push("changed");
      cookies.length = 0;
      headers["X-Single"] = "changed";
      const result = await LoopbackClient.send(fixture.port);
      expect(result.status).toBe(204);
      expect(result.body).toBe("");
      expect(result.fields["content-type"]).toBeUndefined();
      expect(result.fields["content-length"]).toBeUndefined();
      expect(result.fields["x-values"]).toEqual(["first", "second"]);
      expect(result.fields["x-single"]).toEqual(["one"]);
      expect(result.fields["set-cookie"]).toEqual([
        "manual=value",
        "session=opaque; Path=/; Secure; HttpOnly; SameSite=Lax",
      ]);
      expect(Object.isFrozen(fixture.controller.response)).toBe(true);
    } finally {
      await fixture.server.close();
    }
  });
  it("projects DTO objects/arrays before sending generated JSON fields", async () => {
    const fixture = await LoopbackClient.start();
    try {
      fixture.controller.jsonResponse = HttpResponse.json(
        { text: "Ada €", secret: "stripped" },
        { headers: { "X-Custom": "yes" } },
      );
      const result = await LoopbackClient.send(fixture.port, "/json");
      expect(result.status).toBe(200);
      expect(result.fields["content-type"]).toEqual(["application/json"]);
      expect(result.fields["content-length"]).toEqual([String(Buffer.byteLength(result.body))]);
      expect(JSON.parse(result.body)).toEqual({ text: "Ada €" });
      expect(result.body.length).not.toBe(Buffer.byteLength(result.body));
      const created = await LoopbackClient.send(fixture.port, "/created");
      expect(created.status).toBe(201);
      expect(JSON.parse(created.body)).toEqual({ text: "created" });
      const upper = await LoopbackClient.send(fixture.port, "/upper");
      expect(upper.status).toBe(299);
      expect(JSON.parse(upper.body)).toEqual({ text: "upper" });
      fixture.controller.arrayResponse = HttpResponse.json([{ text: "A" }, { text: "B" }]);
      expect(JSON.parse((await LoopbackClient.send(fixture.port, "/array")).body)).toEqual([
        { text: "A" },
        { text: "B" },
      ]);
    } finally {
      await fixture.server.close();
    }
  });
  it.each([199, 300, 204, 205, 200.5, NaN, Infinity, "200", null])(
    "rejects untyped invalid JSON status %s",
    (status) => {
      expect(() => Reflect.apply(HttpResponse.json, HttpResponse, [{}, { status }])).toThrow();
    },
  );
  it.each([null, undefined, true, 1, "text", () => {}])(
    "rejects primitive/nonobject body %s",
    (body) => {
      expect(() => Reflect.apply(HttpResponse.json, HttpResponse, [body])).toThrow();
    },
  );
  it.each([
    "Content-Type",
    "Content-Length",
    "Transfer-Encoding",
    "Connection",
    "Keep-Alive",
    "Trailer",
    "TE",
    "Upgrade",
    "Proxy-Connection",
    "X-Request-Id",
  ])("rejects server-owned %s", (name) => {
    expect(() => HttpResponse.noContent({ headers: { [name]: "unsafe" } })).toThrow();
  });
  it.each([
    { "bad name": "value" },
    { "X-Safe": "line\r\ninjection" },
    { "X-Safe": "\u0100" },
    { "X-Safe": [] },
    { "X-Safe": [1] },
    { "X-Safe": 1 },
    { "X-Safe": "a", "x-safe": "b" },
  ])("rejects malformed header records %#", (headers) => {
    expect(() => Reflect.apply(HttpResponse.noContent, HttpResponse, [{ headers }])).toThrow();
  });
  it("rejects fabricated cookies and preserves custom cookie arrays alongside cookie fields", async () => {
    expect(() =>
      Reflect.apply(HttpResponse.noContent, HttpResponse, [{ cookies: [{}] }]),
    ).toThrow();
    const fixture = await LoopbackClient.start();
    try {
      fixture.controller.response = HttpResponse.noContent({
        headers: { "Set-Cookie": ["one=1", "two=2"] },
        cookies: [HttpCookie.clear("three")],
      });
      expect((await LoopbackClient.send(fixture.port)).fields["set-cookie"]).toHaveLength(3);
      fixture.controller.response = HttpResponse.noContent({
        cookies: [HttpCookie.set("one", "1")],
      });
      expect((await LoopbackClient.send(fixture.port)).fields["set-cookie"]).toHaveLength(1);
    } finally {
      await fixture.server.close();
    }
  });
});
