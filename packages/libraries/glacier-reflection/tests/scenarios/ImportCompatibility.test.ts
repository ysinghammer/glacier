import { describe, expect, it } from "vitest";

describe("source-root activation compatibility", () => {
  it("retains repeated module, definition, handler and declaration identities and unrelated Reflect behavior", async () => {
    const descriptors = Object.getOwnPropertyDescriptors(Reflect);
    const first = await import("../../index.js");
    const handler = Reflect.metadata;
    class Consumer {}
    first.DESIGN_TYPE_METADATA.set(Consumer, String);
    const second = await import("../../index.js");
    expect(first).toBe(second);
    expect(first.DESIGN_TYPE_METADATA).toBe(second.DESIGN_TYPE_METADATA);
    expect(Reflect.metadata).toBe(handler);
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
