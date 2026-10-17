import { expect, it } from "vitest";

it("keeps named and side-effect roots inactive while manual decorators, inheritance and discovery work", async () => {
  const global = Object.getOwnPropertyDescriptor(globalThis, "Reflect");
  const before = Object.getOwnPropertyDescriptors(Reflect);
  await import("../../index.js");
  const root = await import("../../index.js");
  expect(Object.getOwnPropertyDescriptor(globalThis, "Reflect")).toEqual(global);
  expect(Object.getOwnPropertyDescriptors(Reflect)).toEqual(before);
  expect(Object.getOwnPropertyDescriptor(Reflect, "metadata")).toBeUndefined();
  const value = new root.ValueMetadataDefinition<string>("manual");
  const list = new root.ListMetadataDefinition<string>("manual-list");
  const record = new root.RecordMetadataDefinition<number>("manual-record");
  class Base {}
  value.decorator("base")(Base);
  class Derived extends Base {}
  expect(list.set(Base, ["a"])).toEqual({ isValid: true });
  expect(list.set(Derived, ["b"])).toEqual({ isValid: true });
  expect(record.set(Base, { base: 1 })).toEqual({ isValid: true });
  expect(record.set(Derived, { child: 2 })).toEqual({ isValid: true });
  expect(value.read(Derived)).toEqual({ isValid: true, isPresent: true, value: "base" });
  expect(list.read(Derived)).toEqual({ isValid: true, isPresent: true, value: ["a", "b"] });
  expect(record.read(Derived)).toEqual({
    isValid: true,
    isPresent: true,
    value: { base: 1, child: 2 },
  });
  const discovery = root.MetadataDiscovery.definitions(Derived);
  expect(discovery.isValid).toBe(true);
  if (!discovery.isValid) throw new Error(discovery.code);
  expect(discovery.definitions).toHaveLength(3);
  expect(discovery.definitions).toEqual(expect.arrayContaining([value, list, record]));
  expect(Object.getOwnPropertyDescriptors(Reflect)).toEqual(before);
});
