import { describe, expect, it } from "vitest";
import { GlacierContainer, Module } from "../../../index.js";

describe("container serialization safety", () => {
  it("keeps provider credentials out of container and selected-module JSON and spread", async () => {
    const credential = Symbol("credential");
    /** Root module registering a synthetic secret-valued provider. */
    class RootModule {}
    Module({ providers: [{ provide: credential, useValue: "synthetic-provider-secret" }] })(
      RootModule,
    );
    const container = await GlacierContainer.create(RootModule);
    const lookup = container.select(RootModule);
    expect(container.get(credential)).toBe("synthetic-provider-secret");
    expect(lookup.get(credential)).toBe("synthetic-provider-secret");
    expect(JSON.stringify(container)).toBe("{}");
    expect(JSON.stringify(lookup)).toBe("{}");
    expect({ ...container }).toEqual({});
    expect({ ...lookup }).toEqual({});
    const borrowedContainer: unknown = Object.create(container);
    const borrowedLookup: unknown = Object.create(lookup);
    expect(() => container.get.call(borrowedContainer, credential)).toThrow(TypeError);
    expect(() => lookup.get.call(borrowedLookup, credential)).toThrow(TypeError);
    await container.close();
  });
});
