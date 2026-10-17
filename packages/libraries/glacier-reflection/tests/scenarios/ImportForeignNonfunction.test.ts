import { expect, it } from "vitest";

it("rejects an occupied nonfunction slot without replacing its descriptor", async () => {
  Object.defineProperty(Reflect, "metadata", {
    value: 17,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  const before = Object.getOwnPropertyDescriptor(Reflect, "metadata");
  await expect(import("../../index.js")).resolves.toHaveProperty("MetadataBoundaryError");
  expect(Object.getOwnPropertyDescriptor(Reflect, "metadata")).toEqual(before);
  await expect(import("../../register.js")).rejects.toMatchObject({
    name: "MetadataBoundaryError",
    code: "foreign-handler",
  });
  expect(Object.getOwnPropertyDescriptor(Reflect, "metadata")).toEqual(before);
});
