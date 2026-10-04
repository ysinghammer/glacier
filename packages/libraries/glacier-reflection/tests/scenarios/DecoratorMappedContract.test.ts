import { describe, expect, it } from "vitest";
import {
  ListMetadataDefinition,
  MetadataBoundaryError,
  MetadataDiscovery,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
  type IDynamicClassMetadataAddress,
  type IMetadataBoundaryErrorCode,
} from "../../index.js";

describe("mapped package-root legacy decorator contract", () => {
  it("normalizes every legacy callback shape without executing or replacing consumers", () => {
    let executionCount = 0;
    class Consumer {
      constructor() {
        executionCount++;
      }
      get accessor(): string {
        executionCount++;
        return "";
      }
      set accessor(_value: string) {
        executionCount++;
      }
      method(input: string): string {
        return input;
      }
      static method(input: string): string {
        return input;
      }
    }
    const key = Symbol("member");
    const descriptor = Object.getOwnPropertyDescriptor(Consumer.prototype, "accessor");
    if (descriptor === undefined) throw new Error("Missing accessor descriptor");
    const cases: readonly [readonly unknown[], IDynamicClassMetadataAddress][] = [
      [[Consumer], { kind: "class" }],
      [[Consumer.prototype, "property"], { kind: "member", member: "property" }],
      [[Consumer, "property"], { kind: "member", side: "static", member: "property" }],
      [[Consumer.prototype, "method", {}], { kind: "member", member: "method" }],
      [[Consumer, "method", {}], { kind: "member", side: "static", member: "method" }],
      [[Consumer.prototype, "accessor", descriptor], { kind: "member", member: "accessor" }],
      [[Consumer, "accessor", descriptor], { kind: "member", side: "static", member: "accessor" }],
      [[Consumer.prototype, 7, undefined], { kind: "member", member: "7" }],
      [[Consumer, 9], { kind: "member", side: "static", member: "9" }],
      [[Consumer.prototype, key], { kind: "member", member: key }],
      [[Consumer, key], { kind: "member", side: "static", member: key }],
      [[Consumer, undefined, 0], { kind: "constructor-parameter", position: 0 }],
      [
        [Consumer.prototype, "method", 0],
        { kind: "method-parameter", member: "method", position: 0 },
      ],
      [
        [Consumer, "method", 0],
        { kind: "method-parameter", side: "static", member: "method", position: 0 },
      ],
      [[Consumer.prototype, key, 0], { kind: "method-parameter", member: key, position: 0 }],
      [[Consumer, key, 0], { kind: "method-parameter", side: "static", member: key, position: 0 }],
      [[Consumer.prototype, 8, 0], { kind: "method-parameter", member: "8", position: 0 }],
    ];
    const metadata = new ValueMetadataDefinition<object>("mapped-locations");
    for (const [arguments_, address] of cases) {
      const value = { address };
      expect(Reflect.apply(metadata.decorator(value), undefined, arguments_)).toBeUndefined();
      for (const inheritance of ["own", "inherited"] as const) {
        const read = metadata.readDynamic(Consumer, { ...address, inheritance });
        expect(read).toEqual({ isValid: true, isPresent: true, value });
        if (!read.isValid || !read.isPresent) throw new Error("Missing decorated value");
        expect(read.value).toBe(value);
        expect(MetadataDiscovery.definitionsDynamic(Consumer, { ...address, inheritance })).toEqual(
          {
            isValid: true,
            definitions: [metadata],
          },
        );
      }
      const direct = { direct: address };
      expect(metadata.setDynamic(Consumer, direct, address)).toEqual({ isValid: true });
      expect(metadata.readDynamic(Consumer, address)).toEqual({
        isValid: true,
        isPresent: true,
        value: direct,
      });
    }
    expect(metadata.locations(Consumer)).toEqual({
      isValid: true,
      addresses: expect.arrayContaining(
        cases.map(([, address]) => ({
          ...address,
          ...(address.kind === "member" || address.kind === "method-parameter"
            ? { side: address.side ?? "instance" }
            : {}),
        })),
      ),
    });
    expect(Object.getOwnPropertyDescriptor(Consumer.prototype, "accessor")).toEqual(descriptor);
    expect(executionCount).toBe(0);
  });

  it("rejects malformed callback arguments with typed safe errors and unchanged declarations", () => {
    class Consumer {}
    const metadata = new ValueMetadataDefinition<string>("mapped-boundary");
    metadata.set(Consumer, "class-old");
    metadata.setDynamic(Consumer, "member-old", { kind: "member", member: "member" });
    metadata.setDynamic(Consumer, "static-old", {
      kind: "member",
      side: "static",
      member: "member",
    });
    const beforeLocations = metadata.locations(Consumer);
    const cases: readonly [readonly unknown[], IMetadataBoundaryErrorCode][] = [
      [[], "invalid-decorator-target"],
      [[null], "invalid-decorator-target"],
      [[undefined], "invalid-decorator-target"],
      [[() => {}], "invalid-decorator-target"],
      [[{}, "member"], "invalid-decorator-target"],
      [[new Consumer(), "member"], "invalid-decorator-target"],
      [[Consumer.prototype], "invalid-decorator-location"],
      [[Consumer, "member", {}, "extra"], "invalid-decorator-location"],
      [[Consumer, undefined], "invalid-decorator-location"],
      [[Consumer, {}], "invalid-decorator-location"],
      [[Consumer, null], "invalid-decorator-location"],
      [[Consumer, {}, 0], "invalid-decorator-location"],
      [[Consumer.prototype, undefined, 0], "invalid-decorator-location"],
      [[Consumer, "member", null], "invalid-decorator-location"],
      [[Consumer, "member", false], "invalid-decorator-location"],
      [[Consumer, "member", "descriptor"], "invalid-decorator-location"],
      [[Consumer, "member", () => {}], "invalid-decorator-location"],
      [[Consumer, "prototype"], "invalid-decorator-location"],
      [[Consumer, undefined, -1], "invalid-decorator-location"],
      [[Consumer, undefined, 0.5], "invalid-decorator-location"],
      [[Consumer, undefined, Infinity], "invalid-decorator-location"],
      [[Consumer, undefined, NaN], "invalid-decorator-location"],
      [[Consumer, undefined, Number.MAX_SAFE_INTEGER + 1], "invalid-decorator-location"],
      [[Consumer.prototype, "member", -1], "invalid-decorator-location"],
      [[Consumer, "member", -1], "invalid-decorator-location"],
    ];
    for (const [arguments_, code] of cases) {
      let caught: unknown;
      try {
        Reflect.apply(metadata.decorator("new-secret-value"), undefined, arguments_);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(MetadataBoundaryError);
      if (!(caught instanceof MetadataBoundaryError)) throw new Error("Missing boundary error");
      expect(caught.code).toBe(code);
      expect(caught.name).toBe("MetadataBoundaryError");
      expect(caught.message).toBe(`Metadata boundary rejected: ${code}`);
      expect(caught.message).not.toContain("new-secret-value");
      expect(metadata.read(Consumer)).toEqual({
        isValid: true,
        isPresent: true,
        value: "class-old",
      });
      for (const [side, value] of [
        ["instance", "member-old"],
        ["static", "static-old"],
      ] as const) {
        expect(metadata.readDynamic(Consumer, { kind: "member", side, member: "member" })).toEqual({
          isValid: true,
          isPresent: true,
          value,
        });
      }
      expect(metadata.locations(Consumer)).toEqual(beforeLocations);
    }
  });

  it("snapshots list and record annotations at creation, preserving shallow identity and replacement", () => {
    class Base {}
    class Derived extends Base {}
    const item = { label: "original" };
    const supplied = [item];
    const dictionary = { item };
    const list = new ListMetadataDefinition<object>("mapped-list");
    const record = new RecordMetadataDefinition<object>("mapped-record");
    const value = new ValueMetadataDefinition<object>("mapped-value");
    const listCallback = list.decorator(supplied);
    const recordCallback = record.decorator(dictionary);
    const valueCallback = value.decorator(item);
    supplied.splice(0, 1, { label: "changed" });
    dictionary.item = { label: "changed" };
    list.decorator([item])(Base);
    listCallback(Derived);
    recordCallback(Derived);
    valueCallback(Derived);
    const listRead = list.read(Derived);
    const recordRead = record.read(Derived);
    const valueRead = value.read(Derived);
    expect(listRead).toEqual({ isValid: true, isPresent: true, value: [item, item] });
    expect(recordRead).toEqual({ isValid: true, isPresent: true, value: { item } });
    if (
      !listRead.isValid ||
      !listRead.isPresent ||
      !recordRead.isValid ||
      !recordRead.isPresent ||
      !valueRead.isValid ||
      !valueRead.isPresent
    )
      throw new Error("Missing annotations");
    expect(listRead.value[1]).toBe(item);
    expect(recordRead.value["item"]).toBe(item);
    expect(valueRead.value).toBe(item);
    expect(Object.isFrozen(listRead.value)).toBe(true);
    expect(Object.isFrozen(recordRead.value)).toBe(true);
    expect(Reflect.set(listRead.value, "0", {})).toBe(false);
    expect(Reflect.set(recordRead.value, "item", {})).toBe(false);
    list.decorator([])(Derived);
    record.decorator({ latest: item })(Derived);
    expect(list.read(Derived)).toEqual({ isValid: true, isPresent: true, value: [item] });
    expect(record.read(Derived)).toEqual({
      isValid: true,
      isPresent: true,
      value: { latest: item },
    });
  });

  it("propagates inspection and creation-time snapshot exceptions without overwriting annotations", () => {
    class Consumer {}
    const metadata = new ValueMetadataDefinition<string>("mapped-inspection");
    const record = new RecordMetadataDefinition<string>("mapped-snapshot");
    metadata.decorator("old")(Consumer);
    record.decorator({ entry: "old" })(Consumer);
    const failure = new Error("inspection");
    const proxy = new Proxy(
      {},
      {
        getOwnPropertyDescriptor: () => {
          throw failure;
        },
      },
    );
    expect(() => metadata.decorator("new")(proxy, "member")).toThrow(failure);
    expect(() =>
      record.decorator({
        get entry(): string {
          throw failure;
        },
      }),
    ).toThrow(failure);
    expect(metadata.read(Consumer)).toEqual({ isValid: true, isPresent: true, value: "old" });
    expect(record.read(Consumer)).toEqual({
      isValid: true,
      isPresent: true,
      value: { entry: "old" },
    });
  });
});
