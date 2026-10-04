import { beforeEach, describe, expect, it } from "vitest";
import {
  ListMetadataDefinition,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
  MetadataDiscovery,
  MetadataBoundaryError,
} from "../../index.js";
import { ContractTarget as ContractTargetBase } from "../data/ContractTarget.js";

let ContractTarget: typeof ContractTargetBase;
beforeEach(() => {
  ContractTarget = class extends ContractTargetBase {};
});

describe("definition identity and fixed value contracts", () => {
  it("value constructor retains its descriptive name and replacement kind", () => {
    const definition = new ValueMetadataDefinition<string>("same");
    expect(definition.name).toBe("same");
    expect(definition.kind).toBe("value");
  });
  it("list constructor retains its descriptive name and accumulation kind", () => {
    const definition = new ListMetadataDefinition<string>("same");
    expect(definition.name).toBe("same");
    expect(definition.kind).toBe("list");
  });
  it("record constructor retains its descriptive name and accumulation kind", () => {
    const definition = new RecordMetadataDefinition<string>("same");
    expect(definition.name).toBe("same");
    expect(definition.kind).toBe("record");
  });
  it("same-name value definitions remain isolated while a shared identity reads its write", () => {
    const first = new ValueMetadataDefinition<string>("same");
    const second = new ValueMetadataDefinition<string>("same");
    first.set(ContractTarget, "first");
    second.set(ContractTarget, "second");
    expect(first.read(ContractTarget)).toEqual({ isValid: true, isPresent: true, value: "first" });
    expect(second.read(ContractTarget)).toEqual({
      isValid: true,
      isPresent: true,
      value: "second",
    });
  });
  it("same-name list definitions remain isolated", () => {
    const first = new ListMetadataDefinition<string>("same");
    const second = new ListMetadataDefinition<string>("same");
    first.set(ContractTarget, ["first"]);
    second.set(ContractTarget, ["second"]);
    expect(first.read(ContractTarget)).toEqual({
      isValid: true,
      isPresent: true,
      value: ["first"],
    });
    expect(second.read(ContractTarget)).toEqual({
      isValid: true,
      isPresent: true,
      value: ["second"],
    });
  });
  it("same-name record definitions remain isolated", () => {
    const first = new RecordMetadataDefinition<string>("same");
    const second = new RecordMetadataDefinition<string>("same");
    first.set(ContractTarget, { entry: "first" });
    second.set(ContractTarget, { entry: "second" });
    expect(first.read(ContractTarget)).toEqual({
      isValid: true,
      isPresent: true,
      value: { entry: "first" },
    });
    expect(second.read(ContractTarget)).toEqual({
      isValid: true,
      isPresent: true,
      value: { entry: "second" },
    });
  });
  it("same-name definitions from different classes retain distinct discovered identities", () => {
    const value = new ValueMetadataDefinition<string>("same");
    const list = new ListMetadataDefinition<string>("same");
    const record = new RecordMetadataDefinition<string>("same");
    value.set(ContractTarget, "value");
    list.set(ContractTarget, ["list"]);
    record.set(ContractTarget, { entry: "record" });
    const result = MetadataDiscovery.definitions(ContractTarget, {
      kind: "class",
      inheritance: "own",
    });
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(new Set(result.definitions)).toEqual(new Set([value, list, record]));
    }
  });
  it("a valid target with no declaration reports absence rather than rejection", () => {
    const definition = new ValueMetadataDefinition<string>("missing");
    expect(definition.read(ContractTarget)).toEqual({ isValid: true, isPresent: false });
    expect(definition.has(ContractTarget)).toEqual({ isValid: true, isPresent: false });
  });
  it("explicit undefined is present in reads presence and definition discovery", () => {
    const definition = new ValueMetadataDefinition<string | undefined>("undefined");
    definition.set(ContractTarget, undefined);
    expect(definition.read(ContractTarget)).toEqual({
      isValid: true,
      isPresent: true,
      value: undefined,
    });
    expect(definition.has(ContractTarget)).toEqual({ isValid: true, isPresent: true });
    const result = MetadataDiscovery.definitions(ContractTarget);
    expect(result.isValid).toBe(true);
    if (result.isValid) expect(result.definitions).toContain(definition);
  });
  it("explicit undefined overrides a base replacement rather than revealing its value", () => {
    class Derived extends ContractTarget {}
    const definition = new ValueMetadataDefinition<string | undefined>("undefined");
    definition.set(ContractTarget, "base");
    definition.set(Derived, undefined);
    expect(definition.read(Derived)).toEqual({ isValid: true, isPresent: true, value: undefined });
    expect(definition.read(Derived, { kind: "class", inheritance: "own" })).toEqual({
      isValid: true,
      isPresent: true,
      value: undefined,
    });
  });
  it("checked and dynamic writes expose the same class declaration", () => {
    const definition = new ValueMetadataDefinition<string>("shared");
    expect(definition.set(ContractTarget, "checked")).toEqual({ isValid: true });
    expect(definition.readDynamic(ContractTarget)).toEqual({
      isValid: true,
      isPresent: true,
      value: "checked",
    });
    expect(definition.setDynamic(ContractTarget, "dynamic")).toEqual({ isValid: true });
    expect(definition.read(ContractTarget)).toEqual({
      isValid: true,
      isPresent: true,
      value: "dynamic",
    });
    expect(definition.hasDynamic(ContractTarget)).toEqual({ isValid: true, isPresent: true });
  });
  it("checked deletion reports removal then absence without conflating invalid targets", () => {
    const definition = new ValueMetadataDefinition<string>("delete");
    definition.set(ContractTarget, "value");
    expect(definition.delete(ContractTarget)).toEqual({ isValid: true, isDeleted: true });
    expect(definition.delete(ContractTarget)).toEqual({ isValid: true, isDeleted: false });
    expect(definition.read(ContractTarget)).toEqual({ isValid: true, isPresent: false });
  });
  it("dynamic deletion removes the same direct declaration", () => {
    const definition = new ValueMetadataDefinition<string>("delete");
    definition.set(ContractTarget, "value");
    expect(definition.deleteDynamic(ContractTarget)).toEqual({ isValid: true, isDeleted: true });
    expect(definition.hasDynamic(ContractTarget)).toEqual({ isValid: true, isPresent: false });
  });
  it.each(["delete", "deleteDynamic"] as const)(
    "%s of an absent address preserves another address and its discovery index",
    (operation) => {
      const definition = new ValueMetadataDefinition<string>("missing-address");
      expect(definition.set(ContractTarget, "retained")).toEqual({ isValid: true });
      expect(definition[operation](ContractTarget, { kind: "member", member: "field" })).toEqual({
        isValid: true,
        isDeleted: false,
      });
      expect(definition.read(ContractTarget)).toEqual({
        isValid: true,
        isPresent: true,
        value: "retained",
      });
      expect(definition.locations(ContractTarget)).toEqual({
        isValid: true,
        addresses: [{ kind: "class" }],
      });
      expect(MetadataDiscovery.definitions(ContractTarget)).toEqual({
        isValid: true,
        definitions: [definition],
      });
    },
  );
  it.each([
    [undefined, -1],
    [undefined, 0.5],
    ["method", Infinity],
    ["prototype", undefined],
  ])(
    "decorator rejects invalid normalized location %j without changing declarations",
    (member, extra) => {
      const definition = new ValueMetadataDefinition<string>("guard");
      definition.set(ContractTarget, "retained");
      const decorator = definition.decorator("rejected");
      let observed: unknown;
      try {
        Reflect.apply(decorator, undefined, [ContractTarget, member, extra]);
      } catch (error) {
        observed = error;
      }
      expect(observed).toBeInstanceOf(MetadataBoundaryError);
      if (observed instanceof MetadataBoundaryError) {
        expect(observed.code).toBe("invalid-decorator-location");
      }
      expect(definition.read(ContractTarget)).toEqual({
        isValid: true,
        isPresent: true,
        value: "retained",
      });
      expect(definition.locations(ContractTarget)).toEqual({
        isValid: true,
        addresses: [{ kind: "class" }],
      });
    },
  );
});
