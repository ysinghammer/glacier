import { describe, expect, it } from "vitest";
import { HttpCookie, HttpResponse } from "../../../index.js";
import { LoopbackClient } from "../../LoopbackClient.js";

describe("immutable RFC cookie fields", () => {
  it("emits defaults, explicit attributes, opaque values and immediate clearing", async () => {
    const fixture = await LoopbackClient.start();
    try {
      const expires = new Date("2030-01-02T03:04:05Z");
      const cookie = HttpCookie.set("explicit", "a%20+b==", {
        path: "/scope",
        domain: "example.com",
        secure: false,
        httpOnly: false,
        sameSite: "strict",
        maxAge: 30,
        expires,
      });
      expires.setTime(0);
      fixture.controller.response = HttpResponse.noContent({
        cookies: [
          HttpCookie.set("empty", ""),
          cookie,
          HttpCookie.set("__Host-token", "value"),
          HttpCookie.set("__Secure-token", "value", { sameSite: "none" }),
          HttpCookie.clear("explicit", {
            path: "/scope",
            domain: "example.com",
            secure: false,
            httpOnly: false,
          }),
        ],
      });
      expect((await LoopbackClient.send(fixture.port)).fields["set-cookie"]).toEqual([
        "empty=; Path=/; Secure; HttpOnly; SameSite=Lax",
        "explicit=a%20+b==; Path=/scope; Domain=example.com; SameSite=Strict; Max-Age=30; Expires=Wed, 02 Jan 2030 03:04:05 GMT",
        "__Host-token=value; Path=/; Secure; HttpOnly; SameSite=Lax",
        "__Secure-token=value; Path=/; Secure; HttpOnly; SameSite=None",
        "explicit=; Path=/scope; Domain=example.com; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      ]);
      expect(Object.isFrozen(cookie)).toBe(true);
      expect(Object.isFrozen(HttpCookie.clear("default"))).toBe(true);
    } finally {
      await fixture.server.close();
    }
  });
  it.each([
    ["", "v", {}],
    [1, "v", {}],
    ["bad name", "v", {}],
    ["name", 1, {}],
    ["name", "a b", {}],
    ["name", "a;b", {}],
    ["name", "a\r\nb", {}],
    ["name", 'a"b', {}],
    ["name", "v", { path: "" }],
    ["name", "v", { path: 1 }],
    ["name", "v", { path: null }],
    ["name", "v", { path: "/;evil" }],
    ["name", "v", { domain: "bad..domain" }],
    ["name", "v", { domain: 1 }],
    ["name", "v", { secure: 1 }],
    ["name", "v", { secure: null }],
    ["name", "v", { httpOnly: 1 }],
    ["name", "v", { httpOnly: null }],
    ["name", "v", { sameSite: "bad" }],
    ["name", "v", { sameSite: null }],
    ["name", "v", { sameSite: "none", secure: false }],
    ["__Secure-token", "v", { secure: false }],
    ["__Host-token", "v", { secure: false }],
    ["__Host-token", "v", { path: "/x" }],
    ["__Host-token", "v", { domain: "example.com" }],
    ["name", "v", { maxAge: 0.5 }],
    ["name", "v", { maxAge: Infinity }],
    ["name", "v", { expires: new Date(NaN) }],
    ["name", "v", { expires: {} }],
  ])("rejects malformed/security-inconsistent cookie %#", (name, value, options) => {
    expect(() => Reflect.apply(HttpCookie.set, HttpCookie, [name, value, options])).toThrow();
  });
  it("accepts integer expiry ages including immediate expiry", () => {
    expect(HttpCookie.set("a", "v", { maxAge: 0 })).toBeInstanceOf(HttpCookie);
    expect(HttpCookie.set("a", "v", { maxAge: -1 })).toBeInstanceOf(HttpCookie);
    expect(HttpCookie.set("quoted", '"opaque"')).toBeInstanceOf(HttpCookie);
    expect(() => HttpCookie.clear("__Host-a", { path: "/other" })).toThrow();
  });
});
