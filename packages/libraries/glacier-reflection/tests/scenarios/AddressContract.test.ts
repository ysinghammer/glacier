import { beforeEach, describe, expect, it } from "vitest";
import {
  MetadataDiscovery,
  ValueMetadataDefinition,
  type IDynamicClassMetadataAddress,
} from "../../index.js";
import { ContractTarget as ContractTargetBase } from "../data/ContractTarget.js";

let ContractTarget: typeof ContractTargetBase;
beforeEach(() => {
  ContractTarget = class extends ContractTargetBase {};
});

const ADDRESSES = [
  { kind: "class" },
  { kind: "member", member: "field" },
  { kind: "member", side: "static", member: "field" },
  { kind: "constructor-parameter", position: 0 },
  { kind: "constructor-parameter", position: 1 },
  { kind: "method-parameter", member: "method", position: 0 },
  { kind: "method-parameter", member: "method", position: 1 },
  { kind: "method-parameter", side: "static", member: "method", position: 0 },
  { kind: "method-parameter", side: "static", member: "method", position: 1 },
  { kind: "member", member: 7 },
  { kind: "member", member: Symbol.iterator },
] as const;

describe("embedded address validation and location isolation", () => {
  it.each(ADDRESSES)(
    "checked and dynamic operations retain the exact address $kind $side $member $position",
    (address) => {
      const definition = new ValueMetadataDefinition<string>("location");
      expect(definition.set(ContractTarget, "value", address)).toEqual({ isValid: true });
      expect(definition.read(ContractTarget, address)).toEqual({
        isValid: true,
        isPresent: true,
        value: "value",
      });
      expect(definition.readDynamic(ContractTarget, address)).toEqual({
        isValid: true,
        isPresent: true,
        value: "value",
      });
      expect(definition.has(ContractTarget, address)).toEqual({ isValid: true, isPresent: true });
      expect(definition.hasDynamic(ContractTarget, address)).toEqual({
        isValid: true,
        isPresent: true,
      });
      const discovered = MetadataDiscovery.definitions(ContractTarget, address);
      expect(discovered.isValid).toBe(true);
      if (discovered.isValid) expect(discovered.definitions).toContain(definition);
      expect(definition.delete(ContractTarget, address)).toEqual({
        isValid: true,
        isDeleted: true,
      });
    },
  );
  it("all class side member and parameter positions remain isolated", () => {
    class Other extends ContractTarget {}
    const definition = new ValueMetadataDefinition<number>("matrix");
    ADDRESSES.forEach((address, index) => {
      definition.set(ContractTarget, index, address);
      definition.set(Other, index + 100, address);
    });
    ADDRESSES.forEach((address, index) => {
      expect(definition.read(ContractTarget, address)).toEqual({
        isValid: true,
        isPresent: true,
        value: index,
      });
      expect(definition.read(Other, address)).toEqual({
        isValid: true,
        isPresent: true,
        value: index + 100,
      });
    });
  });
  it("numeric keys normalize to strings and omitted side is instance", () => {
    const definition = new ValueMetadataDefinition<string>("numeric");
    definition.set(ContractTarget, "value", { kind: "member", member: 7 });
    expect(
      definition.readDynamic(ContractTarget, { kind: "member", side: "instance", member: "7" }),
    ).toEqual({
      isValid: true,
      isPresent: true,
      value: "value",
    });
    const result = definition.locations(ContractTarget);
    expect(result).toEqual({
      isValid: true,
      addresses: [{ kind: "member", side: "instance", member: "7" }],
    });
  });
  it("dynamic addressing does not bound erased parameters using runtime function length", () => {
    const definition = new ValueMetadataDefinition<string>("erased");
    const address: IDynamicClassMetadataAddress = {
      kind: "method-parameter",
      member: "not-emitted",
      position: 999,
    };
    expect(definition.setDynamic(ContractTarget, "value", address)).toEqual({ isValid: true });
    expect(definition.readDynamic(ContractTarget, address)).toEqual({
      isValid: true,
      isPresent: true,
      value: "value",
    });
    expect(definition.deleteDynamic(ContractTarget, address)).toEqual({
      isValid: true,
      isDeleted: true,
    });
  });
  it("declared fields need not exist on the prototype before construction", () => {
    const definition = new ValueMetadataDefinition<string>("field");
    expect(Object.hasOwn(ContractTarget.prototype, "field")).toBe(false);
    expect(definition.set(ContractTarget, "value", { kind: "member", member: "field" })).toEqual({
      isValid: true,
    });
  });
  it.each([-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "invalid position %s rejects across every direct method without replacing valid data",
    (position) => {
      const definition = new ValueMetadataDefinition<string>("position");
      const valid = { kind: "method-parameter", member: "method", position: 0 } as const;
      const invalid = { kind: "method-parameter", member: "method", position } as const;
      definition.set(ContractTarget, "original", valid);
      const rejection = { isValid: false, code: "invalid-position" };
      expect(definition.setDynamic(ContractTarget, "invalid", invalid)).toEqual(rejection);
      expect(definition.readDynamic(ContractTarget, invalid)).toEqual(rejection);
      expect(definition.hasDynamic(ContractTarget, invalid)).toEqual(rejection);
      expect(definition.deleteDynamic(ContractTarget, invalid)).toEqual(rejection);
      expect(MetadataDiscovery.definitionsDynamic(ContractTarget, invalid)).toEqual(rejection);
      expect(
        Reflect.apply(definition.set, definition, [ContractTarget, "invalid", invalid]),
      ).toEqual(rejection);
      expect(Reflect.apply(definition.read, definition, [ContractTarget, invalid])).toEqual(
        rejection,
      );
      expect(Reflect.apply(definition.has, definition, [ContractTarget, invalid])).toEqual(
        rejection,
      );
      expect(Reflect.apply(definition.delete, definition, [ContractTarget, invalid])).toEqual(
        rejection,
      );
      expect(
        Reflect.apply(MetadataDiscovery.definitions, MetadataDiscovery, [ContractTarget, invalid]),
      ).toEqual(rejection);
      expect(definition.read(ContractTarget, valid)).toEqual({
        isValid: true,
        isPresent: true,
        value: "original",
      });
    },
  );
  it.each([
    { kind: "unknown" },
    { kind: "member", member: "field", side: "unknown" },
    { kind: "member", side: "static", member: "prototype" },
    { kind: "member" },
    { kind: "member", member: {} },
    { kind: "constructor-parameter", position: 0, side: "instance" },
    { kind: "method-parameter", member: "method" },
    { kind: "class", member: "field" },
    { kind: "class", inheritance: "unknown" },
  ])("malformed address rejects explicitly without mutation: %j", (address) => {
    const definition = new ValueMetadataDefinition<string>("invalid");
    definition.set(ContractTarget, "original");
    const rejection = { isValid: false, code: "invalid-address" };
    expect(
      Reflect.apply(definition.setDynamic, definition, [ContractTarget, "invalid", address]),
    ).toEqual(rejection);
    expect(Reflect.apply(definition.readDynamic, definition, [ContractTarget, address])).toEqual(
      rejection,
    );
    expect(Reflect.apply(definition.hasDynamic, definition, [ContractTarget, address])).toEqual(
      rejection,
    );
    expect(Reflect.apply(definition.deleteDynamic, definition, [ContractTarget, address])).toEqual(
      rejection,
    );
    expect(
      Reflect.apply(MetadataDiscovery.definitionsDynamic, MetadataDiscovery, [
        ContractTarget,
        address,
      ]),
    ).toEqual(rejection);
    expect(definition.read(ContractTarget)).toEqual({
      isValid: true,
      isPresent: true,
      value: "original",
    });
  });
  it("mutation inheritance options reject rather than changing the direct declaration", () => {
    const definition = new ValueMetadataDefinition<string>("mode");
    definition.set(ContractTarget, "original");
    const address = { kind: "class", inheritance: "own" };
    expect(Reflect.apply(definition.set, definition, [ContractTarget, "new", address])).toEqual({
      isValid: false,
      code: "invalid-address",
    });
    expect(Reflect.apply(definition.deleteDynamic, definition, [ContractTarget, address])).toEqual({
      isValid: false,
      code: "invalid-address",
    });
    expect(definition.read(ContractTarget)).toEqual({
      isValid: true,
      isPresent: true,
      value: "original",
    });
  });
  it.each([
    null,
    "own",
    { inheritance: "unknown" },
    { kind: "class" },
    { inheritance: "own", side: "instance" },
  ])("location lookup options reject malformed records: %j", (lookup) => {
    const definition = new ValueMetadataDefinition<string>("lookup");
    definition.set(ContractTarget, "original");
    expect(Reflect.apply(definition.locations, definition, [ContractTarget, lookup])).toEqual({
      isValid: false,
      code: "invalid-address",
    });
    expect(definition.read(ContractTarget)).toEqual({
      isValid: true,
      isPresent: true,
      value: "original",
    });
  });
  it("inherited incompatible address fields reject rather than silently selecting class metadata", () => {
    const definition = new ValueMetadataDefinition<string>("inherited-fields");
    definition.set(ContractTarget, "original");
    const address: unknown = Object.assign(Object.create({ side: "static" }), { kind: "class" });
    const rejection = { isValid: false, code: "invalid-address" };
    expect(
      Reflect.apply(definition.setDynamic, definition, [ContractTarget, "new", address]),
    ).toEqual(rejection);
    expect(Reflect.apply(definition.readDynamic, definition, [ContractTarget, address])).toEqual(
      rejection,
    );
    expect(definition.read(ContractTarget)).toEqual({
      isValid: true,
      isPresent: true,
      value: "original",
    });
  });
  it.each([null, "class", 0, { inheritance: "own" }])(
    "non-address inputs reject rather than reporting absence: %j",
    (address) => {
      const definition = new ValueMetadataDefinition<string>("shape");
      expect(Reflect.apply(definition.readDynamic, definition, [ContractTarget, address])).toEqual({
        isValid: false,
        code: "invalid-address",
      });
    },
  );
  it("canonical-looking arrows still reject without invoking their bodies", () => {
    let calls = 0;
    const arrow = () => {
      calls += 1;
    };
    Object.defineProperty(arrow, "prototype", { value: { constructor: arrow } });
    const definition = new ValueMetadataDefinition<string>("constructability");
    expect(Reflect.apply(definition.setDynamic, definition, [arrow, "invalid"])).toEqual({
      isValid: false,
      code: "invalid-target",
    });
    expect(calls).toBe(0);
  });
  it("constructor prototype accessors reject without executing getters", () => {
    let calls = 0;
    const arrow = () => {};
    Object.defineProperty(arrow, "prototype", {
      get() {
        calls += 1;
        throw new Error("prototype getter invoked");
      },
    });
    const definition = new ValueMetadataDefinition<string>("descriptor");
    expect(Reflect.apply(definition.setDynamic, definition, [arrow, "invalid"])).toEqual({
      isValid: false,
      code: "invalid-target",
    });
    expect(calls).toBe(0);
  });
  it.each(["missing", "mismatched", "accessor"] as const)(
    "noncanonical constructor descriptor %s rejects across public operations without consumer calls",
    (shape) => {
      let calls = 0;
      class Malformed {}
      if (shape === "missing") {
        Reflect.deleteProperty(Malformed.prototype, "constructor");
      } else if (shape === "mismatched") {
        Object.defineProperty(Malformed.prototype, "constructor", { value: ContractTarget });
      } else {
        Object.defineProperty(Malformed.prototype, "constructor", {
          get() {
            calls += 1;
            throw new Error("constructor getter invoked");
          },
        });
      }
      const definition = new ValueMetadataDefinition<string>("canonical-descriptor");
      const rejection = { isValid: false, code: "invalid-target" };
      expect(definition.set(Malformed, "invalid")).toEqual(rejection);
      expect(definition.setDynamic(Malformed, "invalid")).toEqual(rejection);
      expect(definition.delete(Malformed)).toEqual(rejection);
      expect(definition.deleteDynamic(Malformed)).toEqual(rejection);
      expect(definition.read(Malformed)).toEqual(rejection);
      expect(definition.readDynamic(Malformed)).toEqual(rejection);
      expect(definition.has(Malformed)).toEqual(rejection);
      expect(definition.hasDynamic(Malformed)).toEqual(rejection);
      expect(definition.locations(Malformed)).toEqual(rejection);
      expect(MetadataDiscovery.definitions(Malformed)).toEqual(rejection);
      expect(MetadataDiscovery.definitionsDynamic(Malformed)).toEqual(rejection);
      expect(calls).toBe(0);
    },
  );
  it("writes copy address fields rather than retaining the caller record", () => {
    const definition = new ValueMetadataDefinition<string>("copied-address");
    const address = { kind: "member", member: "field" } as const;
    definition.set(ContractTarget, "original", address);
    Object.defineProperty(address, "member", { value: "other" });
    expect(definition.read(ContractTarget, { kind: "member", member: "field" })).toEqual({
      isValid: true,
      isPresent: true,
      value: "original",
    });
    expect(definition.readDynamic(ContractTarget, address)).toEqual({
      isValid: true,
      isPresent: false,
    });
  });
  it.each([
    () => ({}),
    () => Object.create(null),
    () => () => {},
    () => ContractTarget.prototype,
    () => new ContractTarget(),
  ])(
    "mutation targets must be constructors, not ordinary objects arrows or prototypes",
    (createTarget) => {
      const target: unknown = createTarget();
      const definition = new ValueMetadataDefinition<string>("target");
      const rejection = { isValid: false, code: "invalid-target" };
      expect(Reflect.apply(definition.set, definition, [target, "invalid"])).toEqual(rejection);
      expect(Reflect.apply(definition.setDynamic, definition, [target, "invalid"])).toEqual(
        rejection,
      );
      expect(Reflect.apply(definition.delete, definition, [target])).toEqual(rejection);
      expect(Reflect.apply(definition.deleteDynamic, definition, [target])).toEqual(rejection);
      expect(definition.read(ContractTarget)).toEqual({ isValid: true, isPresent: false });
    },
  );
});
