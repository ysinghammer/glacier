import { describe, expect, it } from "vitest";
import {
  ListMetadataDefinition,
  MetadataDiscovery,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
  type IDynamicClassMetadataAddress,
  type IDiscoveredMetadataAddress,
} from "../../index.js";

describe("metadata-bearing discovery contracts", () => {
  it("exposes a frozen nonconstructible record with stable readonly operation bindings", () => {
    const checked = MetadataDiscovery.definitions;
    const dynamic = MetadataDiscovery.definitionsDynamic;
    expect(Object.isFrozen(MetadataDiscovery)).toBe(true);
    expect(typeof MetadataDiscovery).toBe("object");
    expect(Object.keys(MetadataDiscovery).sort()).toEqual(["definitions", "definitionsDynamic"]);
    expect("prototype" in MetadataDiscovery).toBe(false);
    for (const [key, operation] of [
      ["definitions", checked],
      ["definitionsDynamic", dynamic],
    ] as const) {
      expect(Object.getOwnPropertyDescriptor(MetadataDiscovery, key)).toEqual({
        value: operation,
        writable: false,
        enumerable: true,
        configurable: false,
      });
      expect(Reflect.set(MetadataDiscovery, key, operation)).toBe(false);
      expect(Reflect.deleteProperty(MetadataDiscovery, key)).toBe(false);
      expect(Reflect.defineProperty(MetadataDiscovery, key, { value: operation })).toBe(true);
    }
    expect(Reflect.set(MetadataDiscovery, "additional", checked)).toBe(false);
    expect(Reflect.defineProperty(MetadataDiscovery, "additional", { value: checked })).toBe(false);
    expect(MetadataDiscovery.definitions).toBe(checked);
    expect(MetadataDiscovery.definitionsDynamic).toBe(dynamic);
  });

  it("keeps detached facade operations independent of this for identities, boundaries and rejections", () => {
    class Owner {}
    class Empty {}
    const label = new ValueMetadataDefinition<undefined>("detached");
    label.set(Owner, undefined);
    const { definitions, definitionsDynamic } = MetadataDiscovery;
    for (const operation of [definitions, definitionsDynamic]) {
      expect(operation(Owner)).toEqual({ isValid: true, definitions: [label] });
      expect(operation(new Owner())).toEqual({ isValid: true, definitions: [label] });
      expect(operation(Empty)).toEqual({ isValid: true, definitions: [] });
      expect(operation({})).toEqual({ isValid: false, code: "invalid-target" });
    }
    expect(definitionsDynamic(Owner, { kind: "constructor-parameter", position: -1 })).toEqual({
      isValid: false,
      code: "invalid-position",
    });
  });

  it("joins decorated and direct collections through both discovery directions and instance aliases", () => {
    class Base {}
    class Leaf extends Base {}
    class Unrelated {}
    const item = { label: "shared" };
    const list = new ListMetadataDefinition<object>("joined");
    const record = new RecordMetadataDefinition<object>("joined");
    const isolated = new ListMetadataDefinition<object>("joined");
    const supplied = [item];
    const entries = { item };
    const decorateList = list.decorator(supplied);
    const decorateRecord = record.decorator(entries);
    supplied.splice(0);
    entries.item = { label: "changed" };
    decorateList(Base.prototype, "member");
    decorateRecord(Base.prototype, "member");
    list.setDynamic(Leaf, [item], { kind: "member", member: "member" });
    record.decorator({})(Leaf.prototype, "member");
    list.decorator([item])(Leaf, "member");
    const first = new Leaf();
    Object.defineProperty(first, "constructor", {
      get: () => {
        throw new Error("shadowed constructor must not execute");
      },
    });
    for (const inheritance of ["own", "inherited"] as const) {
      const lookup = { kind: "member", member: "member", inheritance } as const;
      for (const target of [Leaf, first, new Leaf()]) {
        const definitions = MetadataDiscovery.definitionsDynamic(target, lookup);
        if (!definitions.isValid) throw new Error(definitions.code);
        expect(new Set(definitions.definitions)).toEqual(new Set([list, record]));
        expect(definitions.definitions).toHaveLength(2);
        for (const definition of [list, record]) {
          const locations = definition.locations(target, { inheritance });
          if (!locations.isValid) throw new Error(locations.code);
          const expected = [{ kind: "member", side: "instance", member: "member" }];
          if (target === Leaf && definition === list)
            expected.push({ kind: "member", side: "static", member: "member" });
          expect(new Set(locations.addresses)).toEqual(new Set(expected));
          expect(locations.addresses).toHaveLength(expected.length);
          for (const address of locations.addresses) {
            const read = definition.readDynamic(target, { ...address, inheritance });
            if (!read.isValid || !read.isPresent) throw new Error("missing joined declaration");
            expect(Object.isFrozen(read.value)).toBe(true);
            expect(Reflect.set(read.value, "changed", item)).toBe(false);
            expect(
              MetadataDiscovery.definitionsDynamic(target, { ...address, inheritance }),
            ).toEqual(
              address.kind === "member" && address.side === "static"
                ? { isValid: true, definitions: [list] }
                : definitions,
            );
          }
        }
        const listRead = list.readDynamic(target, lookup);
        const recordRead = record.readDynamic(target, lookup);
        expect(listRead).toEqual({
          isValid: true,
          isPresent: true,
          value: inheritance === "own" ? [item] : [item, item],
        });
        expect(recordRead).toEqual({
          isValid: true,
          isPresent: true,
          value: inheritance === "own" ? {} : { item },
        });
        if (!listRead.isValid || !listRead.isPresent) throw new Error("missing list");
        expect(listRead.value[0]).toBe(item);
        if (recordRead.isValid && recordRead.isPresent && inheritance === "inherited")
          expect(recordRead.value["item"]).toBe(item);
      }
    }
    const before = list.locations(Leaf);
    expect(() => list.decorator([])(first, "member")).toThrow(
      expect.objectContaining({ code: "invalid-decorator-target" }),
    );
    expect(
      list.setDynamic(Leaf, [], { kind: "method-parameter", member: "member", position: -1 }),
    ).toEqual({ isValid: false, code: "invalid-position" });
    expect(list.locations(Leaf)).toEqual(before);
    expect(list.readDynamic(first, { kind: "member", member: "member" })).toEqual({
      isValid: true,
      isPresent: true,
      value: [item, item],
    });
    expect(isolated.locations(Leaf)).toEqual({ isValid: true, addresses: [] });
    expect(list.locations(Unrelated)).toEqual({ isValid: true, addresses: [] });
    expect(list.deleteDynamic(Leaf, { kind: "member", member: "member" })).toEqual({
      isValid: true,
      isDeleted: true,
    });
    expect(list.readDynamic(first, { kind: "member", member: "member" })).toEqual({
      isValid: true,
      isPresent: true,
      value: [item],
    });
    expect(
      MetadataDiscovery.definitionsDynamic(first, {
        kind: "member",
        member: "member",
        inheritance: "own",
      }),
    ).toEqual({ isValid: true, definitions: [record] });
  });

  it("returns actual same-name identities once at an exact address, never a member inventory", () => {
    class Base {}
    class Middle extends Base {}
    class Leaf extends Middle {}
    const first = new ValueMetadataDefinition<string | undefined>("same");
    const second = new ValueMetadataDefinition<string>("same");
    const list = new ListMetadataDefinition<string>("same");
    const record = new RecordMetadataDefinition<string>("same");
    first.set(Base, "base");
    first.set(Middle, undefined);
    first.set(Leaf, undefined);
    second.set(Base, "second");
    list.set(Leaf, []);
    record.set(Leaf, {});
    second.setDynamic(Leaf, "member only", { kind: "member", member: "hidden" });
    for (const target of [Leaf, new Leaf()]) {
      const result = MetadataDiscovery.definitions(target);
      expect(result.isValid).toBe(true);
      if (!result.isValid) throw new Error(result.code);
      expect(new Set(result.definitions)).toEqual(new Set([first, second, list, record]));
      expect(result.definitions).toHaveLength(4);
      expect(result.definitions.find((identity) => identity === first)).toBe(first);
      const own = MetadataDiscovery.definitions(target, { kind: "class", inheritance: "own" });
      if (!own.isValid) throw new Error(own.code);
      expect(new Set(own.definitions)).toEqual(new Set([first, list, record]));
      expect(own.definitions).toHaveLength(3);
      expect(
        MetadataDiscovery.definitionsDynamic(target, { kind: "member", member: "hidden" }),
      ).toEqual({ isValid: true, definitions: [second] });
      expect(
        MetadataDiscovery.definitionsDynamic(target, { kind: "member", member: "absent" }),
      ).toEqual({ isValid: true, definitions: [] });
    }
  });

  it("freezes definition arrays without freezing or copying the actual definitions", () => {
    class Target {}
    const definition = new ValueMetadataDefinition<string>("label");
    definition.set(Target, "value");
    const result = MetadataDiscovery.definitions(Target);
    if (!result.isValid) throw new Error(result.code);
    expect(result.definitions[0]).toBe(definition);
    expect(Object.isFrozen(result.definitions)).toBe(true);
    expect(Object.isFrozen(definition)).toBe(false);
    expect(() => Reflect.set(result.definitions, "0", {})).not.toThrow();
    expect(Reflect.set(result.definitions, "0", {})).toBe(false);
    expect(MetadataDiscovery.definitions(Target)).toEqual({
      isValid: true,
      definitions: [definition],
    });
  });

  it("discovers every canonical address with inheritance deduplication and instance filtering", () => {
    class Base {}
    class Middle extends Base {}
    class Leaf extends Middle {}
    const key = Symbol("member");
    const otherKey = Symbol("member");
    const definition = new ValueMetadataDefinition<string | undefined>("label");
    const addresses: readonly IDynamicClassMetadataAddress[] = [
      { kind: "class" },
      { kind: "member", member: 7 },
      { kind: "member", side: "static", member: 7 },
      { kind: "member", member: key },
      { kind: "member", member: otherKey },
      { kind: "constructor-parameter", position: 4 },
      { kind: "method-parameter", member: "method", position: 2 },
      { kind: "method-parameter", side: "static", member: "method", position: 2 },
    ];
    const canonical: readonly IDiscoveredMetadataAddress[] = [
      { kind: "class" },
      { kind: "member", side: "instance", member: "7" },
      { kind: "member", side: "static", member: "7" },
      { kind: "member", side: "instance", member: key },
      { kind: "member", side: "instance", member: otherKey },
      { kind: "constructor-parameter", position: 4 },
      { kind: "method-parameter", side: "instance", member: "method", position: 2 },
      { kind: "method-parameter", side: "static", member: "method", position: 2 },
    ];
    for (const address of addresses) {
      definition.setDynamic(Base, "base", address);
      definition.setDynamic(Middle, "middle", address);
    }
    definition.set(Leaf, undefined);
    const middleOwn = definition.locations(Middle, { inheritance: "own" });
    if (!middleOwn.isValid) throw new Error(middleOwn.code);
    expect(new Set(middleOwn.addresses)).toEqual(new Set(canonical));
    expect(middleOwn.addresses).toHaveLength(canonical.length);
    for (const address of middleOwn.addresses) {
      expect(definition.readDynamic(Middle, { ...address, inheritance: "own" })).toEqual({
        isValid: true,
        isPresent: true,
        value: "middle",
      });
      expect(
        MetadataDiscovery.definitionsDynamic(Middle, { ...address, inheritance: "own" }),
      ).toEqual({ isValid: true, definitions: [definition] });
    }
    const instance = new Leaf();
    Object.defineProperty(instance, "constructor", {
      get: () => {
        throw new Error("instance constructor must not be read");
      },
    });
    for (const target of [Leaf, instance, new Leaf()]) {
      const result = definition.locations(target);
      if (!result.isValid) throw new Error(result.code);
      const expected =
        target === Leaf
          ? canonical
          : canonical.filter(
              (address) =>
                address.kind === "class" ||
                (address.kind !== "constructor-parameter" && address.side === "instance"),
            );
      expect(new Set(result.addresses)).toEqual(new Set(expected));
      expect(result.addresses).toHaveLength(expected.length);
      for (const address of result.addresses) {
        expect(Object.getPrototypeOf(address)).toBe(Object.prototype);
        expect("target" in address).toBe(false);
        expect("owner" in address).toBe(false);
        expect("inheritance" in address).toBe(false);
        expect(definition.readDynamic(target, address)).toEqual({
          isValid: true,
          isPresent: true,
          value: address.kind === "class" ? undefined : "middle",
        });
        expect(MetadataDiscovery.definitionsDynamic(target, address)).toEqual({
          isValid: true,
          definitions: [definition],
        });
      }
      expect(definition.locations(target, { inheritance: "own" })).toEqual({
        isValid: true,
        addresses: [{ kind: "class" }],
      });
      const own = definition.locations(target, { inheritance: "own" });
      if (!own.isValid) throw new Error(own.code);
      for (const address of own.addresses) {
        expect(definition.readDynamic(target, { ...address, inheritance: "own" })).toEqual({
          isValid: true,
          isPresent: true,
          value: undefined,
        });
      }
    }
    expect(definition.locations(class Unrelated {})).toEqual({ isValid: true, addresses: [] });
    expect(new ValueMetadataDefinition<string>("label").locations(Leaf)).toEqual({
      isValid: true,
      addresses: [],
    });
  });

  it("returns shallow-frozen independent plain addresses and arrays, including empty results", () => {
    class Target {}
    const definition = new ValueMetadataDefinition<string>("label");
    const input: IDynamicClassMetadataAddress = { kind: "member", member: 1 };
    definition.setDynamic(Target, "value", input);
    Reflect.set(input, "member", 2);
    const result = definition.locations(Target);
    if (!result.isValid) throw new Error(result.code);
    for (const address of result.addresses) {
      expect(Object.isFrozen(address)).toBe(true);
      expect(Reflect.set(address, "member", "changed")).toBe(false);
    }
    expect(Object.isFrozen(result.addresses)).toBe(true);
    expect(Reflect.set(result.addresses, "0", { kind: "class" })).toBe(false);
    expect(definition.locations(Target)).toEqual({
      isValid: true,
      addresses: [{ kind: "member", side: "instance", member: "1" }],
    });
    const empty = definition.locations(class Empty {});
    if (!empty.isValid) throw new Error(empty.code);
    expect(Object.isFrozen(empty.addresses)).toBe(true);
    const emptyDefinitions = MetadataDiscovery.definitions(class Empty {});
    if (!emptyDefinitions.isValid) throw new Error(emptyDefinitions.code);
    expect(Object.isFrozen(emptyDefinitions.definitions)).toBe(true);
    definition.deleteDynamic(Target, { kind: "member", member: "1" });
    definition.set(Target, "later");
    expect(result.addresses).toEqual([{ kind: "member", side: "instance", member: "1" }]);
  });

  it("cleans direct indexes while preserving inherited, unrelated and other-definition declarations", () => {
    class Base {}
    class Leaf extends Base {}
    const definition = new ValueMetadataDefinition<string | undefined>("label");
    const other = new ValueMetadataDefinition<string>("label");
    const member: IDynamicClassMetadataAddress = { kind: "member", member: "member" };
    definition.set(Base, "base");
    definition.set(Leaf, undefined);
    definition.setDynamic(Leaf, "member", member);
    other.set(Leaf, "other");
    expect(definition.delete(Leaf)).toEqual({ isValid: true, isDeleted: true });
    expect(definition.locations(Leaf, { inheritance: "own" })).toEqual({
      isValid: true,
      addresses: [{ kind: "member", side: "instance", member: "member" }],
    });
    expect(MetadataDiscovery.definitions(Leaf, { kind: "class", inheritance: "own" })).toEqual({
      isValid: true,
      definitions: [other],
    });
    const inherited = MetadataDiscovery.definitions(Leaf);
    if (!inherited.isValid) throw new Error(inherited.code);
    expect(new Set(inherited.definitions)).toEqual(new Set([definition, other]));
    expect(definition.read(new Leaf())).toEqual({
      isValid: true,
      isPresent: true,
      value: "base",
    });
    definition.deleteDynamic(Leaf, member);
    expect(definition.locations(Leaf, { inheritance: "own" })).toEqual({
      isValid: true,
      addresses: [],
    });
    expect(MetadataDiscovery.definitionsDynamic(Leaf, member)).toEqual({
      isValid: true,
      definitions: [],
    });
    other.delete(Leaf);
    definition.delete(Base);
    expect(definition.locations(Leaf)).toEqual({ isValid: true, addresses: [] });
    expect(MetadataDiscovery.definitions(Leaf)).toEqual({ isValid: true, definitions: [] });
    expect(definition.delete(Leaf)).toEqual({ isValid: true, isDeleted: false });
    definition.set(Leaf, undefined);
    expect(MetadataDiscovery.definitions(Leaf)).toEqual({
      isValid: true,
      definitions: [definition],
    });
  });

  it("retains empty accumulating declarations in both discovery directions after replacement", () => {
    class Base {}
    class Leaf extends Base {}
    const list = new ListMetadataDefinition<string>("empty");
    const record = new RecordMetadataDefinition<string>("empty");
    list.set(Base, ["base"]);
    record.set(Base, { base: "base" });
    list.set(Leaf, []);
    record.set(Leaf, {});
    for (const definition of [list, record]) {
      for (const target of [Leaf, new Leaf()]) {
        expect(definition.locations(target, { inheritance: "own" })).toEqual({
          isValid: true,
          addresses: [{ kind: "class" }],
        });
        expect(definition.has(target, { kind: "class", inheritance: "own" })).toEqual({
          isValid: true,
          isPresent: true,
        });
      }
    }
    const result = MetadataDiscovery.definitions(new Leaf(), { kind: "class", inheritance: "own" });
    if (!result.isValid) throw new Error(result.code);
    expect(new Set(result.definitions)).toEqual(new Set([list, record]));
    expect(result.definitions).toHaveLength(2);
  });

  it("shares typed target and address rejections without disguising them as empty discovery", () => {
    class Target {}
    const definition = new ValueMetadataDefinition<string>("label");
    for (const target of [{}, Object.create(null), Target.prototype]) {
      expect(definition.locations(target)).toEqual({ isValid: false, code: "invalid-target" });
      expect(MetadataDiscovery.definitions(target)).toEqual({
        isValid: false,
        code: "invalid-target",
      });
    }
    for (const address of [
      { kind: "constructor-parameter", position: -1 },
      { kind: "method-parameter", member: "method", position: Number.NaN },
      { kind: "constructor-parameter", position: Number.MAX_SAFE_INTEGER + 1 },
    ] satisfies readonly IDynamicClassMetadataAddress[]) {
      expect(MetadataDiscovery.definitionsDynamic(Target, address)).toEqual({
        isValid: false,
        code: "invalid-position",
      });
    }
    for (const address of [
      { kind: "constructor-parameter", position: 0 },
      { kind: "member", side: "static", member: "field" },
      { kind: "method-parameter", side: "static", member: "method", position: 0 },
    ] satisfies readonly IDynamicClassMetadataAddress[]) {
      expect(MetadataDiscovery.definitionsDynamic(new Target(), address)).toEqual({
        isValid: false,
        code: "instance-address-not-supported",
      });
    }
    expect(
      MetadataDiscovery.definitionsDynamic(Target, {
        kind: "member",
        side: "static",
        member: "prototype",
      }),
    ).toEqual({ isValid: false, code: "invalid-address" });
    expect(
      Reflect.apply(MetadataDiscovery.definitionsDynamic, MetadataDiscovery, [
        Target,
        { kind: "class", side: "instance" },
      ]),
    ).toEqual({ isValid: false, code: "invalid-address" });
    expect(
      Reflect.apply(definition.locations, definition, [Target, { inheritance: "invalid" }]),
    ).toEqual({ isValid: false, code: "invalid-address" });
  });

  it("preserves proxy inspection exceptions for both discovery directions and modes", () => {
    class Target {}
    const definition = new ValueMetadataDefinition<string>("label");
    const failure = new Error("inspection failed");
    const target = new Proxy(new Target(), {
      getPrototypeOf: () => {
        throw failure;
      },
    });
    for (const inheritance of ["own", "inherited"] as const) {
      expect(() => definition.locations(target, { inheritance })).toThrow(failure);
      expect(() => MetadataDiscovery.definitions(target, { kind: "class", inheritance })).toThrow(
        failure,
      );
      const address = new Proxy({ kind: "class" } as const, {
        ownKeys: () => {
          throw failure;
        },
      });
      expect(() => MetadataDiscovery.definitionsDynamic(Target, address)).toThrow(failure);
      const lookup = new Proxy(
        { inheritance },
        {
          ownKeys: () => {
            throw failure;
          },
        },
      );
      expect(() => definition.locations(Target, lookup)).toThrow(failure);
    }
  });

  it("keeps sides, parameter kinds, positions and canonical numeric aliases exact", () => {
    class Target {}
    const member = new ValueMetadataDefinition<string>("same");
    const parameter = new ValueMetadataDefinition<string>("same");
    const constructor = new ValueMetadataDefinition<string>("same");
    const staticMember = new ValueMetadataDefinition<string>("same");
    const staticParameter = new ValueMetadataDefinition<string>("same");
    member.setDynamic(Target, "first", { kind: "member", member: 3 });
    member.setDynamic(Target, "replacement", { kind: "member", member: "3" });
    parameter.setDynamic(Target, "parameter", {
      kind: "method-parameter",
      member: 3,
      position: 0,
    });
    constructor.setDynamic(Target, "constructor", { kind: "constructor-parameter", position: 0 });
    staticMember.setDynamic(Target, "static", { kind: "member", side: "static", member: 3 });
    staticParameter.setDynamic(Target, "static parameter", {
      kind: "method-parameter",
      side: "static",
      member: 3,
      position: 0,
    });
    for (const [definition, address] of [
      [member, { kind: "member", member: "3" }],
      [parameter, { kind: "method-parameter", member: "3", position: 0 }],
      [constructor, { kind: "constructor-parameter", position: 0 }],
      [staticMember, { kind: "member", side: "static", member: "3" }],
      [staticParameter, { kind: "method-parameter", side: "static", member: "3", position: 0 }],
    ] as const) {
      for (const inheritance of ["own", "inherited"] as const) {
        expect(MetadataDiscovery.definitionsDynamic(Target, { ...address, inheritance })).toEqual({
          isValid: true,
          definitions: [definition],
        });
      }
      const result = definition.locations(Target);
      if (!result.isValid) throw new Error(result.code);
      expect(result.addresses).toHaveLength(1);
    }
    expect(
      MetadataDiscovery.definitionsDynamic(Target, {
        kind: "method-parameter",
        member: "3",
        position: 1,
      }),
    ).toEqual({ isValid: true, definitions: [] });
    expect(MetadataDiscovery.definitions(Target)).toEqual({ isValid: true, definitions: [] });
  });
});
