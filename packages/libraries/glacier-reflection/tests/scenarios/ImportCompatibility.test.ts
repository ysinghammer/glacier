import { describe, expect, it } from "vitest";

describe("explicit registration after source-root import", () => {
  it("retains repeated module, definition, handler and declaration identities and unrelated Reflect behavior", async () => {
    const descriptors = Object.getOwnPropertyDescriptors(Reflect);
    const first = await import("../../index.js");
    expect(Object.getOwnPropertyDescriptors(Reflect)).toEqual(descriptors);
    const registration = await import("../../register.js");
    const handler = Reflect.metadata;
    class Consumer {}
    Reflect.metadata("design:type", String)(Consumer);
    Reflect.metadata("design:paramtypes", [Number])(Consumer);
    const originalParameters = first.DESIGN_PARAMETER_TYPES_METADATA.read(Consumer);
    const second = await import("../../index.js");
    expect(await import("../../register.js")).toBe(registration);
    expect(Object.keys(registration)).toEqual([]);
    expect(Object.getOwnPropertyDescriptor(Reflect, "metadata")).toEqual({
      value: handler,
      configurable: true,
      writable: true,
      enumerable: false,
    });
    expect(first).toBe(second);
    expect(first.DESIGN_TYPE_METADATA).toBe(second.DESIGN_TYPE_METADATA);
    expect(Reflect.metadata).toBe(handler);
    const parameters = second.DESIGN_PARAMETER_TYPES_METADATA.read(Consumer);
    expect(parameters).toEqual(originalParameters);
    if (
      !parameters.isValid ||
      !parameters.isPresent ||
      !originalParameters.isValid ||
      !originalParameters.isPresent
    ) {
      throw new Error("Expected genuine compiler parameter records");
    }
    expect(parameters.value).toBe(originalParameters.value);
    expect(Object.isFrozen(parameters.value)).toBe(true);
    const definitions = second.MetadataDiscovery.definitions(Consumer);
    expect(definitions).toEqual({
      isValid: true,
      definitions: [first.DESIGN_TYPE_METADATA, first.DESIGN_PARAMETER_TYPES_METADATA],
    });
    expect(typeof handler).toBe("function");
    expect(second.DESIGN_TYPE_METADATA.read(Consumer)).toEqual({
      isValid: true,
      isPresent: true,
      value: String,
    });
    expect(Object.keys(Reflect).filter((key) => !(key in descriptors))).toEqual([]);
    for (const [key, descriptor] of Object.entries(descriptors)) {
      expect(Object.getOwnPropertyDescriptor(Reflect, key)).toEqual(descriptor);
    }
    expect(Reflect.apply(Math.max, undefined, [2, 7])).toBe(7);
  });
});
