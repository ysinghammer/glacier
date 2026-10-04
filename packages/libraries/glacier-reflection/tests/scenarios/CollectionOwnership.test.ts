import { describe, expect, it } from "vitest";
import {
  ListMetadataDefinition,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
} from "../../index.js";

describe("shallow accumulating collection ownership", () => {
  it("freezes own-only snapshots without freezing or deduplicating their contained values", () => {
    class Target {}
    const contained = { name: "shared" };
    const list = new ListMetadataDefinition<typeof contained>("own list");
    const record = new RecordMetadataDefinition<typeof contained>("own record");
    list.set(Target, [contained, contained]);
    record.set(Target, { first: contained, second: contained });
    const listRead = list.read(Target, { kind: "class", inheritance: "own" });
    const recordRead = record.read(Target, { kind: "class", inheritance: "own" });
    if (!listRead.isValid || !listRead.isPresent || !recordRead.isValid || !recordRead.isPresent) {
      throw new Error("Expected own collections");
    }
    expect(listRead.value).toHaveLength(2);
    expect(listRead.value[0]).toBe(contained);
    expect(listRead.value[1]).toBe(contained);
    expect(recordRead.value["first"]).toBe(contained);
    expect(recordRead.value["second"]).toBe(contained);
    expect(Object.isFrozen(listRead.value)).toBe(true);
    expect(Object.isFrozen(recordRead.value)).toBe(true);
    expect(Object.getPrototypeOf(recordRead.value)).toBe(null);
    expect(Object.isFrozen(contained)).toBe(false);
  });
  it("copies and freezes input and output list structure, preserving contained objects and replacement identity", () => {
    class Base {}
    class Leaf extends Base {}
    const first = { name: "first" };
    const second = { name: "second" };
    const input = [first];
    const list = new ListMetadataDefinition<{ name: string }>("list");
    const whole = new ValueMetadataDefinition<typeof input>("whole");
    list.set(Base, input);
    whole.set(Base, input);
    input.push(second);
    input[0] = second;
    list.set(Leaf, [second]);
    for (const target of [Base, Leaf, new Leaf()]) {
      const result = list.read(target);
      if (!result.isValid || !result.isPresent) throw new Error("Expected list");
      expect(result.value[0]).toBe(first);
      expect(Object.isFrozen(result.value)).toBe(true);
      expect(Reflect.set(result.value, "0", second)).toBe(false);
      expect(Reflect.deleteProperty(result.value, "0")).toBe(false);
    }
    first.name = "changed";
    expect(Object.isFrozen(first)).toBe(false);
    expect(list.read(Leaf)).toEqual({ isValid: true, isPresent: true, value: [first, second] });
    const replacement = whole.read(Leaf);
    if (!replacement.isValid || !replacement.isPresent) throw new Error("Expected replacement");
    expect(replacement.value).toBe(input);
    expect(Object.isFrozen(input)).toBe(false);
  });

  it("copies own enumerable string entries into frozen null-prototype records with safe reserved keys", () => {
    class Base {}
    class Leaf extends Base {}
    const person = { name: "Ada" };
    const replacement = { name: "Grace" };
    const input: Record<string, { name: string }> = { person };
    Object.setPrototypeOf(input, { inherited: person });
    Object.defineProperty(input, "__proto__", {
      value: person,
      enumerable: true,
      configurable: true,
    });
    Object.defineProperty(input, "hidden", { value: person });
    Object.defineProperty(input, Symbol("ignored"), { value: person, enumerable: true });
    input["constructor"] = person;
    const record = new RecordMetadataDefinition<{ name: string }>("people");
    record.set(Base, input);
    delete input["person"];
    input["new"] = replacement;
    input["constructor"] = replacement;
    record.set(Leaf, { person: replacement });
    for (const target of [Base, Leaf, new Leaf()]) {
      const result = record.read(target);
      if (!result.isValid || !result.isPresent) throw new Error("Expected record");
      expect(Object.getPrototypeOf(result.value)).toBe(null);
      expect(Object.isFrozen(result.value)).toBe(true);
      expect(Object.keys(result.value).sort()).toEqual(["__proto__", "constructor", "person"]);
      expect(Object.getOwnPropertySymbols(result.value)).toEqual([]);
      expect(result.value["constructor"]).toBe(person);
      expect(result.value["__proto__"]).toBe(person);
      expect(result.value["person"]).toBe(target === Base ? person : replacement);
      expect(result.value["inherited"]).toBeUndefined();
      expect(Reflect.set(result.value, "person", person)).toBe(false);
      expect(Reflect.deleteProperty(result.value, "constructor")).toBe(false);
    }
    person.name = "mutable nested value";
    expect(Object.isFrozen(person)).toBe(false);
  });

  it("prepares complete snapshots before writes so an enumerable getter failure leaves previous data intact", () => {
    class Target {}
    const record = new RecordMetadataDefinition<string>("atomic");
    record.set(Target, { old: "retained" });
    const failure = new Error("snapshot failure");
    const input = { next: "new" };
    Object.defineProperty(input, "broken", {
      enumerable: true,
      get: () => {
        throw failure;
      },
    });
    expect(() => record.set(Target, input)).toThrow(failure);
    expect(record.read(Target)).toEqual({
      isValid: true,
      isPresent: true,
      value: { old: "retained" },
    });
  });
});
