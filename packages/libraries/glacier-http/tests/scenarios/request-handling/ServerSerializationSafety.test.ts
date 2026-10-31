import { describe, expect, it } from "vitest";
import { inspect } from "node:util";
import { ApiGet } from "../../../index.js";
import { EndpointDeclarations } from "../../EndpointDeclarations.js";
import { LoopbackClient } from "../../LoopbackClient.js";

describe("server-owned state serialization", () => {
  it("keeps controller credentials and native handles out of output before and after listening", async () => {
    /** Controller fixture with a secret value and one serializable route. */
    class Controller {
      /**
       * Synthetic private value that must not appear in server inspection.
       * @default `synthetic-controller-secret`
       */
      public readonly credential = "synthetic-controller-secret";
      /**
       * Serves the empty test route.
       * @returns No value; exercises declared void response handling.
       */
      public empty(): void {}
    }
    EndpointDeclarations.controller(Controller);
    EndpointDeclarations.route(Controller, "empty", ApiGet("/empty"));
    const fixture = await LoopbackClient.start({ controllers: [new Controller()] });
    try {
      expect(JSON.stringify(fixture.server)).toBe("{}");
      expect({ ...fixture.server }).toEqual({});
      expect(inspect(fixture.server)).not.toContain("synthetic-");
      expect((await LoopbackClient.send(fixture.port, "/empty")).status).toBe(204);
      const borrowed: unknown = Object.create(fixture.server);
      expect(() => fixture.server.address.call(borrowed)).toThrow(TypeError);
    } finally {
      await fixture.server.close();
    }
    expect(JSON.stringify(fixture.server)).toBe("{}");
  });
});
