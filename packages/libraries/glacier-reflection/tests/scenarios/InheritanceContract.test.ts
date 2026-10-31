import { describe, expect, it } from "vitest";
import {
  ListMetadataDefinition,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
  type IDynamicClassMetadataAddress,
} from "../../index.js";

describe("declared inheritance contracts", () => {
  it("matches parameter positions without claiming equivalent signatures or leaking other positions", () => {
    /** Base fixture declares constructor and method positions for inheritance checks. */
    class Base {
      /**
       * Creates a base consumer with one dependency argument.
       * @param dependency Base constructor value.
       */
      constructor(
        /** Dependency value retained as a public instance property. */
        public dependency: string,
      ) {}
      /**
       * Returns the input using the broad base method signature.
       * @param input Unrestricted base method input.
       * @returns The same input value.
       */
      public run(input: unknown): unknown {
        return input;
      }
    }
    /** Overrides base positions with different declared parameter types. */
    class Leaf extends Base {
      /**
       * Creates the leaf with its own constructor parameter.
       * @param count Numeric leaf constructor value.
       */
      constructor(
        /** Numeric value retained as the leaf's public instance property. */
        public count: number,
      ) {
        super("base");
      }
      /**
       * Narrows the inherited method signature for tuple identity checks.
       * @param input Numeric leaf method input.
       * @returns The same numeric input.
       */
      public override run(input: number): number {
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
    /** Base class may own an empty record declaration. */
    class Base {}
    /** Child class distinguishes inherited and own empty records. */
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
    /** Root class owns the original replacement value. */
    class Base {}
    /** Middle class supplies the nearest inherited replacement. */
    class Middle extends Base {}
    /** Leaf class tests own writes and ancestor revelation after deletion. */
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
    /** Root class contributes the first list value. */
    class Base {}
    /** Middle class contributes the replacement list value. */
    class Middle extends Base {}
    /** Leaf class contributes an explicit empty list declaration. */
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
    /** Root class contributes base record entries. */
    class Base {}
    /** Middle class replaces conflicting entries for record merge checks. */
    class Middle extends Base {}
    /** Leaf class supplies an empty record while retaining ancestors. */
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
      /** Base declares the constructor position used by matching-address checks. */
      class Base {
        /**
         * Creates the base with its original parameter value.
         * @param input Base constructor input.
         */
        constructor(
          /** Base constructor value retained for address matching. */
          public input: string,
        ) {}
      }
      /** Leaf adds a constructor position at the same address. */
      class Leaf extends Base {
        /**
         * Creates the leaf with its own flag and the required base argument.
         * @param flag Leaf constructor flag.
         */
        constructor(
          /** Leaf flag retained for same-location accumulation checks. */
          public flag: boolean,
        ) {
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
