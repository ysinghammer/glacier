import { beforeEach, describe, expect, it } from "vitest";
import { MetadataDiscovery, ValueMetadataDefinition } from "../../index.js";
import { ContractTarget as ContractTargetBase } from "../data/ContractTarget.js";

let ContractTarget: typeof ContractTargetBase;
beforeEach(() => {
  ContractTarget = class extends ContractTargetBase {};
});

describe("instances are read-only aliases for canonical class declarations", () => {
  it.each(["inherited", "own"] as const)(
    "two instances and their constructor share class member and method-parameter reads in %s mode",
    (inheritance) => {
      const definition = new ValueMetadataDefinition<string>("alias");
      const first = new ContractTarget();
      const second = new ContractTarget();
      for (const address of [
        { kind: "class" },
        { kind: "member", member: "field" },
        { kind: "method-parameter", member: "method", position: 1 },
      ] as const) {
        definition.set(ContractTarget, "value", address);
        const lookup = { ...address, inheritance };
        for (const target of [ContractTarget, first, second]) {
          expect(definition.read(target, lookup)).toEqual({
            isValid: true,
            isPresent: true,
            value: "value",
          });
          expect(definition.readDynamic(target, lookup)).toEqual({
            isValid: true,
            isPresent: true,
            value: "value",
          });
          expect(definition.has(target, lookup)).toEqual({ isValid: true, isPresent: true });
          expect(definition.hasDynamic(target, lookup)).toEqual({ isValid: true, isPresent: true });
          const discovered = MetadataDiscovery.definitions(target, lookup);
          expect(discovered.isValid).toBe(true);
          if (discovered.isValid) expect(discovered.definitions).toContain(definition);
          expect(MetadataDiscovery.definitionsDynamic(target, lookup)).toEqual(discovered);
        }
      }
      expect(definition.locations(first, { inheritance })).toEqual(
        definition.locations(ContractTarget, { inheritance }),
      );
    },
  );
  it.each(["inherited", "own"] as const)(
    "subclass aliases resolve the subclass in %s mode",
    (inheritance) => {
      class Derived extends ContractTarget {}
      const definition = new ValueMetadataDefinition<string>("subclass");
      const inherited = new ValueMetadataDefinition<string>("base-only");
      definition.set(ContractTarget, "base");
      definition.set(Derived, "derived");
      inherited.set(ContractTarget, "base-only");
      const instance = new Derived();
      const lookup = { kind: "class", inheritance } as const;
      expect(definition.read(instance, lookup)).toEqual({
        isValid: true,
        isPresent: true,
        value: "derived",
      });
      expect(inherited.read(instance, lookup)).toEqual(
        inheritance === "own"
          ? { isValid: true, isPresent: false }
          : { isValid: true, isPresent: true, value: "base-only" },
      );
      expect(inherited.has(instance, lookup)).toEqual({
        isValid: true,
        isPresent: inheritance === "inherited",
      });
      expect(MetadataDiscovery.definitions(instance, lookup)).toEqual(
        MetadataDiscovery.definitions(Derived, lookup),
      );
      expect(inherited.locations(instance, { inheritance })).toEqual(
        inherited.locations(Derived, { inheritance }),
      );
    },
  );
  it("instance-owned constructor values and getters never redirect or execute during lookup", () => {
    class Unrelated {}
    const definition = new ValueMetadataDefinition<string>("shadowed");
    definition.set(ContractTarget, "correct");
    definition.set(Unrelated, "wrong");
    const first = new ContractTarget();
    Object.defineProperty(first, "constructor", { value: Unrelated });
    const second = new ContractTarget();
    Object.defineProperty(second, "constructor", {
      get() {
        throw new Error("instance getter invoked");
      },
    });
    for (const target of [first, second]) {
      expect(definition.read(target)).toEqual({ isValid: true, isPresent: true, value: "correct" });
      expect(definition.has(target)).toEqual({ isValid: true, isPresent: true });
      expect(MetadataDiscovery.definitions(target)).toEqual({
        isValid: true,
        definitions: [definition],
      });
      expect(definition.locations(target)).toEqual({
        isValid: true,
        addresses: [{ kind: "class" }],
      });
    }
  });
  it("lookup never constructs consumers or executes instance member getters", () => {
    let constructions = 0;
    let getterCalls = 0;
    class Guarded {
      constructor() {
        constructions += 1;
      }
      get field(): string {
        getterCalls += 1;
        throw new Error("getter invoked");
      }
    }
    const instance = new Guarded();
    const definition = new ValueMetadataDefinition<string>("guarded");
    definition.set(Guarded, "value", { kind: "member", member: "field" });
    expect(definition.read(instance, { kind: "member", member: "field" })).toEqual({
      isValid: true,
      isPresent: true,
      value: "value",
    });
    definition.has(instance);
    definition.locations(instance);
    MetadataDiscovery.definitions(instance);
    expect(constructions).toBe(1);
    expect(getterCalls).toBe(0);
  });
  it("an intermediate noncanonical prototype resolves the nearest canonical class without getters", () => {
    const instance = new ContractTarget();
    const intermediate: object = Object.create(ContractTarget.prototype);
    Object.defineProperty(intermediate, "constructor", {
      get() {
        throw new Error("intermediate constructor getter invoked");
      },
    });
    Object.setPrototypeOf(instance, intermediate);
    const definition = new ValueMetadataDefinition<string>("nearest");
    definition.set(ContractTarget, "value");
    expect(definition.read(instance)).toEqual({ isValid: true, isPresent: true, value: "value" });
  });
  it.each([
    () => ({}),
    () => Object.create(null),
    () => Object.prototype,
    () => ContractTarget.prototype,
  ])(
    "plain null-prototype and class-prototype objects reject instead of returning absence",
    (createTarget) => {
      const target: object = createTarget();
      const definition = new ValueMetadataDefinition<string>("invalid");
      const rejection = { isValid: false, code: "invalid-target" };
      expect(definition.readDynamic(target)).toEqual(rejection);
      expect(definition.read(target)).toEqual(rejection);
      expect(definition.hasDynamic(target)).toEqual(rejection);
      expect(definition.has(target)).toEqual(rejection);
      expect(definition.locations(target)).toEqual(rejection);
      expect(MetadataDiscovery.definitionsDynamic(target)).toEqual(rejection);
      expect(MetadataDiscovery.definitions(target)).toEqual(rejection);
    },
  );
  it.each([
    { kind: "member", side: "static", member: "field" },
    { kind: "method-parameter", side: "static", member: "method", position: 0 },
    { kind: "constructor-parameter", position: 0 },
  ] as const)("instance requests reject unsupported address category %j", (address) => {
    const definition = new ValueMetadataDefinition<string>("restricted");
    const instance = new ContractTarget();
    const rejection = { isValid: false, code: "instance-address-not-supported" };
    expect(definition.readDynamic(instance, address)).toEqual(rejection);
    expect(definition.hasDynamic(instance, address)).toEqual(rejection);
    expect(MetadataDiscovery.definitionsDynamic(instance, address)).toEqual(rejection);
    expect(Reflect.apply(definition.read, definition, [instance, address])).toEqual(rejection);
    expect(Reflect.apply(definition.has, definition, [instance, address])).toEqual(rejection);
    expect(
      Reflect.apply(MetadataDiscovery.definitions, MetadataDiscovery, [instance, address]),
    ).toEqual(rejection);
  });
  it("instance location discovery filters static and constructor-parameter declarations", () => {
    const definition = new ValueMetadataDefinition<string>("filtered");
    definition.set(ContractTarget, "class");
    definition.set(ContractTarget, "instance", { kind: "member", member: "field" });
    definition.set(ContractTarget, "static", { kind: "member", side: "static", member: "field" });
    definition.set(ContractTarget, "constructor", { kind: "constructor-parameter", position: 0 });
    const result = definition.locations(new ContractTarget());
    expect(result.isValid).toBe(true);
    if (result.isValid)
      expect(result.addresses).toEqual(
        expect.arrayContaining([
          { kind: "class" },
          { kind: "member", side: "instance", member: "field" },
        ]),
      );
    if (result.isValid) expect(result.addresses).toHaveLength(2);
  });
  it("constructors supplied through erased object references retain constructor-side dynamic lookup", () => {
    const erased: object = ContractTarget;
    const definition = new ValueMetadataDefinition<string>("erased");
    const address = { kind: "member", side: "static", member: "field" } as const;
    definition.set(ContractTarget, "value", address);
    expect(definition.readDynamic(erased, address)).toEqual({
      isValid: true,
      isPresent: true,
      value: "value",
    });
  });
  it.each(["read", "readDynamic", "has", "hasDynamic", "locations"] as const)(
    "exceptional prototype inspection failures remain observable through %s",
    (operation) => {
      const failure = new Error("inspection failed");
      const target = new Proxy(new ContractTarget(), {
        getPrototypeOf() {
          throw failure;
        },
      });
      const definition = new ValueMetadataDefinition<string>("exception");
      expect(() => definition[operation](target)).toThrow(failure);
    },
  );
  it.each(["definitions", "definitionsDynamic"] as const)(
    "exceptional inspection failures remain observable through discovery %s",
    (operation) => {
      const failure = new Error("inspection failed");
      const target = new Proxy(new ContractTarget(), {
        getPrototypeOf() {
          throw failure;
        },
      });
      expect(() => MetadataDiscovery[operation](target)).toThrow(failure);
    },
  );
  it("exceptional constructor descriptor inspection is not translated into an invalid-target outcome", () => {
    const failure = new Error("descriptor inspection failed");
    const target = new Proxy(ContractTarget, {
      getOwnPropertyDescriptor() {
        throw failure;
      },
    });
    const definition = new ValueMetadataDefinition<string>("descriptor");
    expect(() => definition.set(target, "value")).toThrow(failure);
    expect(() => definition.delete(target)).toThrow(failure);
    expect(() => definition.read(target)).toThrow(failure);
    expect(() => definition.has(target)).toThrow(failure);
    expect(() => definition.locations(target)).toThrow(failure);
    expect(() => MetadataDiscovery.definitions(target)).toThrow(failure);
  });
  it("a noncanonical prototype constructor cannot redirect an instance lookup", () => {
    class Other {}
    const intermediate: object = Object.create(ContractTarget.prototype);
    Object.defineProperty(intermediate, "constructor", { value: Other });
    const instance = new ContractTarget();
    Object.setPrototypeOf(instance, intermediate);
    const definition = new ValueMetadataDefinition<string>("canonical-match");
    definition.set(Other, "wrong");
    definition.set(ContractTarget, "correct");
    expect(definition.read(instance)).toEqual({
      isValid: true,
      isPresent: true,
      value: "correct",
    });
    expect(definition.hasDynamic(instance)).toEqual({ isValid: true, isPresent: true });
    expect(definition.locations(instance)).toEqual({
      isValid: true,
      addresses: [{ kind: "class" }],
    });
    expect(MetadataDiscovery.definitionsDynamic(instance)).toEqual({
      isValid: true,
      definitions: [definition],
    });
  });
});
