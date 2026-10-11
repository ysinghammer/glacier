import { expect, it } from "vitest";

it("rejects a locked empty slot without changing its descriptor", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "Reflect");
  if (original === undefined) throw new Error("Missing platform descriptor");
  const facade = Object.create(null, Object.getOwnPropertyDescriptors(Reflect));
  Object.defineProperty(facade, "metadata", {
    value: undefined,
    configurable: false,
    writable: false,
  });
  Object.defineProperty(globalThis, "Reflect", { value: facade, configurable: true });
  const before = Object.getOwnPropertyDescriptor(facade, "metadata");
  let failure: unknown;
  try {
    await import("../../index.js");
  } catch (error) {
    failure = error;
  } finally {
    Object.defineProperty(globalThis, "Reflect", original);
  }
  expect(failure).toMatchObject({ name: "MetadataBoundaryError", code: "installation-failed" });
  expect(Object.getOwnPropertyDescriptor(facade, "metadata")).toEqual(before);
});
