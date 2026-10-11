import { expect, it } from "vitest";

it("rejects an occupied accessor without invoking it or replacing its descriptor", async () => {
  let calls = 0;
  Object.defineProperty(Reflect, "metadata", {
    get() {
      calls++;
      throw new Error("Foreign accessor must not execute");
    },
    configurable: true,
    enumerable: true,
  });
  const before = Object.getOwnPropertyDescriptor(Reflect, "metadata");
  await expect(import("../../index.js")).rejects.toMatchObject({
    name: "MetadataBoundaryError",
    code: "foreign-handler",
  });
  expect(Object.getOwnPropertyDescriptor(Reflect, "metadata")).toEqual(before);
  expect(calls).toBe(0);
});
