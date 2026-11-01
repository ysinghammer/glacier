import { describe, expect, it } from "vitest";
import { ApiGet, HttpResponse } from "../../../index.js";
import { BodyDto, ObservationDto } from "../../data/BindingController.js";
import { EndpointDeclarations } from "../../EndpointDeclarations.js";
import { LoopbackClient } from "../../LoopbackClient.js";

describe("repeatable explicit output contracts and declared void", () => {
  it("void/undefined means declared 204; undeclared void and plain/invalid values remain safe 500", async () => {
    /** Application-owned return source deliberately permits untrusted results. */
    class Controller {
      /** Current untrusted value returned by the JSON fixture handler. */
      public value: unknown;
      /**
       * Represents a declared bodyless controller operation.
       * @returns No value; the route is expected to produce HTTP 204.
       */
      public empty(): void {}
      /**
       * Returns the current fixture value without claiming it is a valid response.
       * @returns Current untrusted value for boundary validation.
       */
      public json(): unknown {
        return this.value;
      }
    }
    const controller = new Controller();
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "empty", ApiGet("/empty"));
    EndpointDeclarations.route(Controller, "json", ApiGet("/json"), { status: 200, type: BodyDto });
    const diagnostics: unknown[] = [];
    const fixture = await LoopbackClient.start({
      controllers: [controller],
      onError: (error, context) => {
        diagnostics.push({ error, context });
      },
    });
    try {
      expect((await LoopbackClient.send(fixture.port, "/empty")).status).toBe(204);
      for (const value of [
        undefined,
        { count: 1, label: "raw" },
        HttpResponse.noContent(),
        HttpResponse.json(
          { count: "secret", label: "reject" },
          { headers: { "X-Secret": "not-committed" } },
        ),
        HttpResponse.json([{ count: 1, label: "ok" }]),
      ]) {
        controller.value = value;
        const result = await LoopbackClient.send(fixture.port, "/json");
        expect(result.status).toBe(500);
        expect(result.body).not.toContain("secret");
        expect(result.body).not.toContain("private-refinement-detail");
        expect(result.fields["x-secret"]).toBeUndefined();
      }
      const outputIssue = diagnostics.find(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          "context" in item &&
          typeof item.context === "object" &&
          item.context !== null &&
          "issues" in item.context,
      );
      expect(outputIssue).toBeDefined();
      expect(JSON.stringify(outputIssue)).not.toContain("secret");
      controller.value = HttpResponse.json({ count: 1, label: "ok", extra: "stripped" });
      expect(JSON.parse((await LoopbackClient.send(fixture.port, "/json")).body)).toEqual({
        count: 1,
        label: "ok",
      });
    } finally {
      await fixture.server.close();
    }
  });
  it("non-JSON values, cycles and inspected accessors produce value-free diagnostics and no partial fields", async () => {
    /** An application-owned controller returns deliberately unsafe values through the public envelope. */
    class Controller {
      /** Current value inserted into a public response envelope. */
      public value: unknown;
      /**
       * Wraps the current fixture value in a JSON response with a private header.
       * @returns Response envelope for serialization and output validation tests.
       */
      public json(): unknown {
        return HttpResponse.json(
          { value: this.value },
          { headers: { "X-Private": "never-committed" } },
        );
      }
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "json", ApiGet("/json"), {
      status: 200,
      type: ObservationDto,
    });
    const controller = new Controller();
    const diagnostics: unknown[] = [];
    const fixture = await LoopbackClient.start({
      controllers: [controller],
      onError: (error, context) => {
        diagnostics.push({ error, context });
      },
    });
    let getterCalls = 0;
    const accessor = Object.defineProperty({}, "private", {
      enumerable: true,
      get: () => {
        getterCalls++;
        return "credential-value";
      },
    });
    const cycle: Record<string, unknown> = {};
    cycle["self"] = cycle;
    try {
      for (const value of [
        1n,
        NaN,
        Infinity,
        () => "credential-value",
        Symbol("credential-value"),
        new Date(),
        cycle,
        accessor,
      ]) {
        controller.value = value;
        const result = await LoopbackClient.send(fixture.port, "/json");
        expect(result.status).toBe(500);
        expect(result.fields["x-private"]).toBeUndefined();
        expect(result.body).not.toContain("credential-value");
      }
      expect(getterCalls).toBe(0);
      expect(diagnostics).toHaveLength(8);
      expect(JSON.stringify(diagnostics)).not.toContain("credential-value");
      controller.value = { logical: [1, true, null, "safe"] };
      expect(JSON.parse((await LoopbackClient.send(fixture.port, "/json")).body)).toEqual({
        value: { logical: [1, true, null, "safe"] },
      });
    } finally {
      await fixture.server.close();
    }
  });
});
