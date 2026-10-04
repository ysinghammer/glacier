import { describe, expect, it } from "vitest";
import {
  ListMetadataDefinition,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
  type IDynamicClassMetadataAddress,
} from "../../index.js";

describe("declared inheritance contracts", () => {
  it("matches parameter positions without claiming equivalent signatures or leaking other positions", () => {
    class Base {
      constructor(public dependency: string) {}
      run(input: unknown): unknown {
        return input;
      }
    }
    class Leaf extends Base {
      constructor(public count: number) {
        super("base");
      }
      override run(input: number): number {
        return input;
      }
    }
    const value = new ValueMetadataDefinition<string>("parameter");
    const constructorAddress = { kind: "constructor-parameter", position: 0 } as const;
    const methodAddress = { kind: "method-parameter", member: "run", position: 0 } as const;
    value.set(Base, "base constructor meaning", constructorAddress);
    value.set(Base, "base method meaning", methodAddress);
    expect(value.read(Leaf, constructorAddress)).toEqual({
      isValid: true,
      isPresent: true,
      value: "base constructor meaning",
    });
    expect(value.read(new Leaf(1), methodAddress)).toEqual({
      isValid: true,
      isPresent: true,
      value: "base method meaning",
    });
    expect(value.read(Leaf, { ...methodAddress, inheritance: "own" })).toEqual({
      isValid: true,
      isPresent: false,
    });
    expect(value.readDynamic(Leaf, { ...methodAddress, position: 1 })).toEqual({
      isValid: true,
      isPresent: false,
    });
    value.set(Leaf, "discarded", methodAddress);
    value.set(Leaf, "latest", methodAddress);
    expect(value.read(Leaf, methodAddress)).toEqual({
      isValid: true,
      isPresent: true,
      value: "latest",
    });
  });

  it("distinguishes absent records from present empty records in both lookup modes", () => {
    class Base {}
    class Leaf extends Base {}
    const records = new RecordMetadataDefinition<string>("empty");
    expect(records.read(Leaf)).toEqual({ isValid: true, isPresent: false });
    records.set(Base, {});
    expect(records.read(Leaf)).toEqual({ isValid: true, isPresent: true, value: {} });
    expect(records.has(Leaf, { kind: "class", inheritance: "own" })).toEqual({
      isValid: true,
      isPresent: false,
    });
    records.set(Leaf, {});
    expect(records.read(Leaf, { kind: "class", inheritance: "own" })).toEqual({
      isValid: true,
      isPresent: true,
      value: {},
    });
    records.delete(Leaf);
    expect(records.has(Leaf)).toEqual({ isValid: true, isPresent: true });
  });
  it("replaces whole values at the nearest declaration, including undefined, and reveals ancestors on deletion", () => {
    class Base {}
    class Middle extends Base {}
    class Leaf extends Middle {}
    const definition = new ValueMetadataDefinition<object | undefined>("value");
    const base = { label: "base", nested: { retained: true } };
    const middle = { nested: { retained: false } };
    expect(definition.set(Base, base)).toEqual({ isValid: true });
    expect(definition.set(Middle, middle)).toEqual({ isValid: true });
    expect(definition.read(Leaf)).toEqual({ isValid: true, isPresent: true, value: middle });
    const inherited = definition.read(new Leaf());
    if (!inherited.isValid || !inherited.isPresent) throw new Error("Expected inherited value");
    expect(inherited.value).toBe(middle);
    expect(definition.read(Leaf, { kind: "class", inheritance: "own" })).toEqual({
      isValid: true,
      isPresent: false,
    });
    expect(definition.set(Leaf, undefined)).toEqual({ isValid: true });
    expect(definition.has(new Leaf())).toEqual({ isValid: true, isPresent: true });
    expect(definition.read(Leaf)).toEqual({ isValid: true, isPresent: true, value: undefined });
    expect(definition.delete(Leaf)).toEqual({ isValid: true, isDeleted: true });
    expect(definition.delete(Leaf)).toEqual({ isValid: true, isDeleted: false });
    expect(definition.read(Leaf)).toEqual({ isValid: true, isPresent: true, value: middle });
    expect(definition.read(Base)).toEqual({ isValid: true, isPresent: true, value: base });
  });

  it("concatenates three levels ancestor-first with duplicates, replaces repeated writes and does not reset", () => {
    class Base {}
    class Middle extends Base {}
    class Leaf extends Middle {}
    const tags = new ListMetadataDefinition<string>("tags");
    expect(tags.read(Leaf)).toEqual({ isValid: true, isPresent: false });
    expect(tags.set(Base, ["a", "b"])).toEqual({ isValid: true });
    expect(tags.set(Middle, ["discarded"])).toEqual({ isValid: true });
    expect(tags.set(Middle, ["b", "c"])).toEqual({ isValid: true });
    expect(tags.set(Leaf, [])).toEqual({ isValid: true });
    expect(tags.read(new Leaf())).toEqual({
      isValid: true,
      isPresent: true,
      value: ["a", "b", "b", "c"],
    });
    expect(tags.read(Middle, { kind: "class", inheritance: "own" })).toEqual({
      isValid: true,
      isPresent: true,
      value: ["b", "c"],
    });
    expect(tags.read(Leaf, { kind: "class", inheritance: "own" })).toEqual({
      isValid: true,
      isPresent: true,
      value: [],
    });
    expect(tags.has(Leaf, { kind: "class", inheritance: "own" })).toEqual({
      isValid: true,
      isPresent: true,
    });
    expect(tags.delete(Middle)).toEqual({ isValid: true, isDeleted: true });
    expect(tags.read(Leaf)).toEqual({ isValid: true, isPresent: true, value: ["a", "b"] });
    expect(tags.delete(Leaf)).toEqual({ isValid: true, isDeleted: true });
    expect(tags.has(Leaf, { kind: "class", inheritance: "own" })).toEqual({
      isValid: true,
      isPresent: false,
    });
  });

  it("accumulates homogeneous records but replaces conflicting entries whole rather than recursively", () => {
    class Base {}
    class Middle extends Base {}
    class Leaf extends Middle {}
    const records = new RecordMetadataDefinition<{ optional: boolean; label?: string }>("record");
    const replacement = new ValueMetadataDefinition<
      Record<string, { optional: boolean; label?: string }>
    >("value");
    const base = { service: { optional: true, label: "base" }, retained: { optional: true } };
    const middle = { service: { optional: false } };
    records.set(Base, base);
    replacement.set(Base, base);
    records.set(Middle, { discarded: { optional: true } });
    records.set(Middle, middle);
    replacement.set(Middle, middle);
    records.set(Leaf, {});
    expect(records.read(Leaf)).toEqual({
      isValid: true,
      isPresent: true,
      value: { ...base, ...middle },
    });
    expect(replacement.read(Leaf)).toEqual({ isValid: true, isPresent: true, value: middle });
    expect(records.read(Middle, { kind: "class", inheritance: "own" })).toEqual({
      isValid: true,
      isPresent: true,
      value: middle,
    });
    expect(records.has(Leaf, { kind: "class", inheritance: "own" })).toEqual({
      isValid: true,
      isPresent: true,
    });
    expect(records.delete(Middle)).toEqual({ isValid: true, isDeleted: true });
    expect(records.read(Leaf)).toEqual({ isValid: true, isPresent: true, value: base });
  });

  for (const address of [
    { kind: "class" },
    { kind: "member", member: "run" },
    { kind: "member", side: "static", member: "run" },
    { kind: "constructor-parameter", position: 0 },
    { kind: "method-parameter", member: "run", position: 0 },
    { kind: "method-parameter", side: "static", member: "run", position: 0 },
  ] satisfies IDynamicClassMetadataAddress[]) {
    it(`accumulates only the matching ${JSON.stringify(address)} location and preserves unrelated declarations`, () => {
      class Base {
        constructor(public input: string) {}
      }
      class Leaf extends Base {
        constructor(public flag: boolean) {
          super("different");
        }
      }
      const list = new ListMetadataDefinition<string>("positions");
      list.setDynamic(Base, ["base"], address);
      list.setDynamic(Leaf, ["leaf"], address);
      list.setDynamic(Leaf, ["unrelated"], { kind: "member", member: "other" });
      expect(list.readDynamic(Leaf, address)).toEqual({
        isValid: true,
        isPresent: true,
        value: ["base", "leaf"],
      });
      expect(list.readDynamic(Leaf, { ...address, inheritance: "own" })).toEqual({
        isValid: true,
        isPresent: true,
        value: ["leaf"],
      });
      expect(list.deleteDynamic(Leaf, address)).toEqual({ isValid: true, isDeleted: true });
      expect(list.readDynamic(Leaf, address)).toEqual({
        isValid: true,
        isPresent: true,
        value: ["base"],
      });
      expect(list.readDynamic(Leaf, { kind: "member", member: "other" })).toEqual({
        isValid: true,
        isPresent: true,
        value: ["unrelated"],
      });
    });
  }
});
