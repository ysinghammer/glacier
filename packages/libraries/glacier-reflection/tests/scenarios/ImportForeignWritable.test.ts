import { expect, it } from "vitest";

it("rejects a writable foreign handler without replacing its descriptor", async () => {
  const foreign = (): void => {};
  Object.defineProperty(Reflect, "metadata", {
    value: foreign,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  const before = Object.getOwnPropertyDescriptor(Reflect, "metadata");
  await expect(import("../../index.js")).rejects.toMatchObject({
    name: "MetadataBoundaryError",
    code: "foreign-handler",
  });
  expect(Object.getOwnPropertyDescriptor(Reflect, "metadata")).toEqual(before);
});
