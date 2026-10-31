import { describe, expect, it } from "vitest";
import { ApiGet, ApiMapError, HttpResponse, HttpCookie } from "../../../index.js";
import { Schema, Optional } from "@glacier/schema";
import type { IHttpErrorContext } from "../../../index.js";
import { EndpointDeclarations } from "../../EndpointDeclarations.js";
import { LoopbackClient } from "../../LoopbackClient.js";
import { BodyDto } from "../../data/BindingController.js";

describe("framework-owned RFC 9457 privacy and mapping boundaries", () => {
  it("framework response/cookie factory and schema failures thrown inside a controller remain unmappable", async () => {
    /** Framework operations invoked in a controller are not application-owned exception types. */
    class Controller {
      /**
       * Selects the framework operation exercised by the fixture route.
       * @default `json`
       */
      public mode = "json";
      /**
       * Runs the selected response, cookie, or schema operation.
       * @returns Result of the selected framework operation.
       */
      public value(): unknown {
        if (this.mode === "json")
          return HttpResponse.json({}, { headers: { "Bad Header": "secret" } });
        if (this.mode === "empty")
          return HttpResponse.noContent({ headers: { "X-Field": "secret\r\nfield" } });
        if (this.mode === "cookie") return HttpCookie.set("bad name", "secret");
        if (this.mode === "clear") return HttpCookie.clear("bad name");
        if (this.mode === "schema-input")
          return Schema.parse(BodyDto, { count: "secret", label: "safe" });
        /** Missing schema declarations are exceptional framework definition failures. */
        class UndeclaredDto {
          /**
           * Field deliberately lacks a schema declaration.
           * @default `secret`
           */
          public field = "secret";
        }
        Optional()(UndeclaredDto.prototype, "field");
        return Schema.prepare(UndeclaredDto);
      }
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "value", ApiGet("/factory"));
    ApiMapError(Error, { status: 418, title: "Never framework" })(Controller);
    const controller = new Controller();
    const diagnostics: IHttpErrorContext[] = [];
    const diagnosticErrors: Error[] = [];
    const fixture = await LoopbackClient.start({
      controllers: [controller],
      onError: (error, context) => {
        diagnosticErrors.push(error);
        diagnostics.push(context);
      },
    });
    try {
      for (const mode of [
        "json",
        "empty",
        "cookie",
        "clear",
        "schema-input",
        "schema-definition",
      ]) {
        controller.mode = mode;
        const result = await LoopbackClient.send(fixture.port, "/factory");
        expect(result.status).toBe(500);
        expect(result.body).not.toContain("secret");
        expect(result.body).not.toContain("Never framework");
        expect(result.fields["x-field"]).toBeUndefined();
      }
      expect(diagnostics).toHaveLength(6);
      expect(diagnostics.every((context) => context.phase === "controller")).toBe(true);
      expect(JSON.stringify({ diagnostics, diagnosticErrors })).not.toContain("secret");
      expect(diagnostics[4]?.issues).toEqual([{ path: ["count"], code: "invalid_type" }]);
      expect(diagnosticErrors.every((error) => error.cause === undefined)).toBe(true);
    } finally {
      await fixture.server.close();
    }
  });
  it("controller mappings cannot replace auth/input/output/routing failures; mapped 401 retains the static challenge", async () => {
    /** Application exceptions and invalid output share Error, but only invocation throws are mapped. */
    class Controller {
      /**
       * Throws an application rejection for HTTP error mapping.
       * @returns No value; this operation always throws.
       * @throws {Error} Always, with a private message and cause.
       */
      public rejected(): never {
        throw new Error("secret", { cause: new Error("secret-cause") });
      }
      /**
       * Returns an invalid output envelope to test output-boundary handling.
       * @returns JSON response carrying an invalid count value.
       */
      public output(): unknown {
        return HttpResponse.json({ count: "secret-value", label: "safe" });
      }
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "rejected", ApiGet("/rejected"));
    EndpointDeclarations.route(Controller, "output", ApiGet("/output"), {
      status: 200,
      type: BodyDto,
    });
    ApiMapError(Error, { status: 401, title: "Static rejection" })(Controller);
    const diagnostics: { error: Error; context: IHttpErrorContext }[] = [];
    let isAuthFailure = false;
    const fixture = await LoopbackClient.start({
      controllers: [new Controller()],
      authentication: {
        challenge: { scheme: "Bearer", realm: "api" },
        authenticate: () => {
          if (isAuthFailure) throw new Error("secret-token");
          return "actor";
        },
      },
      errorMappings: [{ error: Error, status: 418, title: "Never framework" }],
      onError: (error, context) => {
        diagnostics.push({ error, context });
      },
    });
    expect(fixture.server.registration.hasAuthentication).toBe(true);
    try {
      const mapped = await LoopbackClient.send(fixture.port, "/rejected");
      expect(mapped.status).toBe(401);
      expect(mapped.fields["www-authenticate"]).toEqual(['Bearer realm="api"']);
      expect(JSON.parse(mapped.body).title).toBe("Static rejection");
      expect(diagnostics).toHaveLength(0);
      const output = await LoopbackClient.send(fixture.port, "/output");
      expect(JSON.parse(output.body)).toMatchObject({
        type: "about:blank",
        title: "Internal Server Error",
        detail: "Internal Server Error",
        status: 500,
      });
      expect(output.body).not.toContain("secret");
      expect(diagnostics[0]?.context.phase).toBe("output");
      expect(JSON.stringify(diagnostics)).not.toContain("secret-value");
      isAuthFailure = true;
      expect((await LoopbackClient.send(fixture.port, "/rejected")).status).toBe(500);
      expect(diagnostics[1]?.context.phase).toBe("authentication");
      expect((await LoopbackClient.send(fixture.port, "/unknown")).status).toBe(404);
      expect((await LoopbackClient.send(fixture.port, "/rejected", [], "POST")).status).toBe(405);
      expect((await LoopbackClient.send(fixture.port, "/rejected?bad[]=secret")).status).toBe(400);
      const head = await LoopbackClient.send(fixture.port, "/rejected", [], "HEAD");
      expect(head.status).toBe(500);
      expect(head.body).toBe("");
    } finally {
      await fixture.server.close();
    }
  });
  it("unmapped Error and non-Error throws are generic correlated 500 without exposing message/cause/stack/properties", async () => {
    /** Untrusted throw values never define public JSON. */
    class Controller {
      /** Untrusted failure value thrown by the fixture route. */
      public failure: unknown;
      /**
       * Throws the configured untrusted value without rendering it.
       * @returns No value; execution always throws the configured value.
       * @throws {unknown} When invoked, throws the value currently stored in `failure`.
       */
      public value(): never {
        throw this.failure;
      }
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "value", ApiGet("/failure"));
    const controller = new Controller();
    const failures: Error[] = [];
    const fixture = await LoopbackClient.start({
      controllers: [controller],
      onError: (error) => {
        failures.push(error);
      },
    });
    try {
      for (const value of [
        new Error("secret-message", { cause: "secret-cause" }),
        {
          token: "secret-property",
          toString: () => {
            throw new Error("must not stringify");
          },
        },
        "secret-string",
      ]) {
        controller.failure = value;
        const result = await LoopbackClient.send(fixture.port, "/failure");
        expect(result.status).toBe(500);
        expect(result.fields["content-type"]).toEqual(["application/problem+json"]);
        expect(Number(result.fields["content-length"]?.[0])).toBe(Buffer.byteLength(result.body));
        expect(JSON.parse(result.body)).toEqual({
          type: "about:blank",
          title: "Internal Server Error",
          detail: "Internal Server Error",
          status: 500,
          requestId: result.fields["x-request-id"]?.[0],
        });
        expect(result.body).not.toContain("secret");
      }
      expect(failures).toHaveLength(3);
      expect(failures.every((failure) => failure instanceof Error)).toBe(true);
    } finally {
      await fixture.server.close();
    }
  });
});
