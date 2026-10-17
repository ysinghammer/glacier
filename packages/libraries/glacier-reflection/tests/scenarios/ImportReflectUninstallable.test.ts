import { expect, it } from "vitest";

it("rejects a nonextensible intrinsic-preserving Reflect facade without installing a handler", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "Reflect");
  if (original === undefined) throw new Error("Missing platform descriptor");
  const facade = Object.create(null, Object.getOwnPropertyDescriptors(Reflect));
  Object.preventExtensions(facade);
  Object.defineProperty(globalThis, "Reflect", { value: facade, configurable: true });
  const before = Object.getOwnPropertyDescriptor(facade, "metadata");
  let failure: unknown;
  try {
    await import("../../index.js");
    expect(Object.getOwnPropertyDescriptor(facade, "metadata")).toEqual(before);
    try {
      await import("../../register.js");
    } catch (error) {
      failure = error;
    }
  } finally {
    Object.defineProperty(globalThis, "Reflect", original);
  }
  expect(failure).toMatchObject({ name: "MetadataBoundaryError", code: "installation-failed" });
  expect(Object.getOwnPropertyDescriptor(facade, "metadata")).toEqual(before);
  expect(Object.isExtensible(facade)).toBe(false);
});
