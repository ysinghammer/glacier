import { expect, it } from "vitest";

it("registers first then reads compiler records through the canonical root definitions and discovery", async () => {
  const registration = await import("../../register.js");
  const handler = Reflect.metadata;
  const root = await import("../../index.js");
  class Consumer {}
  Reflect.metadata("design:type", String)(Consumer);
  expect(root.DESIGN_TYPE_METADATA.read(Consumer)).toEqual({
    isValid: true,
    isPresent: true,
    value: String,
  });
  expect(root.MetadataDiscovery.definitions(Consumer)).toEqual({
    isValid: true,
    definitions: [root.DESIGN_TYPE_METADATA],
  });
  expect(await import("../../register.js")).toBe(registration);
  expect(Reflect.metadata).toBe(handler);
  expect((await import("../../index.js")).DESIGN_TYPE_METADATA).toBe(root.DESIGN_TYPE_METADATA);
});
