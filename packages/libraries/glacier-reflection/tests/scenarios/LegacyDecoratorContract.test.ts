import { describe, expect, it } from "vitest";
import {
  ListMetadataDefinition,
  MetadataBoundaryError,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
  type IDynamicClassMetadataAddress,
} from "../../index.js";

describe("legacy decorator public contract", () => {
  it("normalizes callbacks to direct locations and returns void without replacing descriptors", () => {
    /** Provides one throwing getter and a callable member for decorator mapping. */
    class Consumer {
      /**
       * Throws on access so decorator handling can prove it preserves descriptors.
       * @returns Never returns; every read throws.
       * @throws {Error} Whenever a caller evaluates the getter.
       */
      public get accessor(): string {
        throw new Error("getter invoked");
      }
      /**
       * Returns its input unchanged as a decorated method target.
       * @param input Text argument represented by the method parameter address.
       * @returns The same text value.
       */
      public method(input: string): string {
        return input;
      }
    }
    const metadata = new ValueMetadataDefinition<object>("identity");
    const value = {};
    const callback = metadata.decorator(value);
    const descriptor = Object.getOwnPropertyDescriptor(Consumer.prototype, "accessor");
    if (descriptor === undefined) throw new Error("missing accessor descriptor");
    expect(callback(Consumer)).toBeUndefined();
    expect(callback(Consumer.prototype, "accessor", descriptor)).toBeUndefined();
    expect(callback(Consumer.prototype, "method", 0)).toBeUndefined();
    expect(callback(Consumer, undefined, 0)).toBeUndefined();
    expect(callback(Consumer, "method", 0)).toBeUndefined();
    expect(Object.getOwnPropertyDescriptor(Consumer.prototype, "accessor")).toEqual(descriptor);
    for (const address of [
      { kind: "class" },
      { kind: "member", member: "accessor" },
      { kind: "method-parameter", member: "method", position: 0 },
      { kind: "constructor-parameter", position: 0 },
      { kind: "method-parameter", side: "static", member: "method", position: 0 },
    ] satisfies IDynamicClassMetadataAddress[]) {
      expect(metadata.readDynamic(Consumer, address)).toEqual({
        isValid: true,
        isPresent: true,
        value,
      });
      expect(metadata.setDynamic(Consumer, value, address)).toEqual({ isValid: true });
      const result = metadata.readDynamic(Consumer, address);
      if (result.isValid && result.isPresent) expect(result.value).toBe(value);
    }
    callback(Consumer.prototype, "accessor", { set: () => {} });
    expect(metadata.read(Consumer, { kind: "member", member: "accessor" })).toEqual({
      isValid: true,
      isPresent: true,
      value,
    });
    const key = Symbol("member");
    expect(Reflect.apply(callback, undefined, [Consumer.prototype, 7, undefined])).toBeUndefined();
    expect(callback(Consumer.prototype, key)).toBeUndefined();
    expect(callback(Consumer.prototype, key, 0)).toBeUndefined();
    for (const address of [
      { kind: "member", member: "7" },
      { kind: "member", member: key },
      { kind: "method-parameter", member: key, position: 0 },
    ] satisfies IDynamicClassMetadataAddress[]) {
      expect(metadata.readDynamic(Consumer, address)).toEqual({
        isValid: true,
        isPresent: true,
        value,
      });
    }
  });

  it("snapshots accumulating containers at creation while retaining contained and replacement identities", () => {
    /** Base class receives the original accumulating decorator values. */
    class Base {}
    /** Derived class receives later direct decorator contributions. */
    class Derived extends Base {}
    const item = { label: "original" };
    const supplied = [item];
    const dictionary = { item };
    const list = new ListMetadataDefinition<object>("list");
    const record = new RecordMetadataDefinition<object>("record");
    const value = new ValueMetadataDefinition<object>("value");
    const listCallback = list.decorator(supplied);
    const recordCallback = record.decorator(dictionary);
    const valueCallback = value.decorator(item);
    supplied.splice(0, 1, { label: "changed" });
    dictionary.item = { label: "changed" };
    list.decorator([item])(Base);
    listCallback(Derived);
    recordCallback(Derived);
    valueCallback(Derived);
    expect(list.read(Derived)).toEqual({ isValid: true, isPresent: true, value: [item, item] });
    const own = list.read(Derived, { kind: "class", inheritance: "own" });
    const entries = record.read(Derived);
    const replacement = value.read(Derived);
    if (own.isValid && own.isPresent) {
      expect(Object.isFrozen(own.value)).toBe(true);
      expect(own.value[0]).toBe(item);
    } else throw new Error("missing own annotation");
    if (entries.isValid && entries.isPresent) {
      expect(entries.value["item"]).toBe(item);
      expect(Object.isFrozen(entries.value)).toBe(true);
    } else throw new Error("missing record annotation");
    if (replacement.isValid && replacement.isPresent) expect(replacement.value).toBe(item);
    else throw new Error("missing replacement annotation");
    list.decorator([])(Derived);
    expect(list.read(Derived)).toEqual({ isValid: true, isPresent: true, value: [item] });
    record.decorator({ latest: item })(Derived);
    expect(record.read(Derived)).toEqual({
      isValid: true,
      isPresent: true,
      value: { latest: item },
    });
  });

  it("inherits parameter annotations by location only and replaces repeated direct annotations", () => {
    /** Base declares the original method-parameter location. */
    class Base {
      /**
       * Returns the base argument for parameter-address inheritance checks.
       * @param input Text value represented by the inherited parameter declaration.
       * @returns The same text value.
       */
      public method(input: string): string {
        return input;
      }
    }
    /** Derived class replaces the method at the same parameter address. */
    class Derived extends Base {
      /**
       * Returns a default value from the narrower override signature.
       * @returns Empty text.
       */
      public override method(): string {
        return "";
      }
    }
    const metadata = new ValueMetadataDefinition<string>("parameter");
    metadata.decorator("ancestor")(Base.prototype, "method", 0);
    const address = {
      kind: "method-parameter",
      member: "method",
      position: 0,
    } satisfies IDynamicClassMetadataAddress;
    expect(metadata.readDynamic(Derived, address)).toEqual({
      isValid: true,
      isPresent: true,
      value: "ancestor",
    });
    expect(metadata.readDynamic(Derived, { ...address, inheritance: "own" })).toEqual({
      isValid: true,
      isPresent: false,
    });
    metadata.decorator("first")(Derived.prototype, "method", 0);
    metadata.decorator("last")(Derived.prototype, "method", 0);
    expect(metadata.readDynamic(Derived, address)).toEqual({
      isValid: true,
      isPresent: true,
      value: "last",
    });
  });

  it("rejects invalid decorator targets and locations atomically with safe boundary codes", () => {
    /** Target used to verify invalid decorator input leaves existing data unchanged. */
    class Consumer {}
    const metadata = new ValueMetadataDefinition<string>("boundary");
    metadata.set(Consumer, "old");
    expect(() => metadata.decorator("new")).not.toThrow();
    const callback = metadata.decorator("new");
    const cases: readonly [readonly unknown[], string][] = [
      [[{}, "member"], "invalid-decorator-target"],
      [[null], "invalid-decorator-target"],
      [[undefined], "invalid-decorator-target"],
      [[new Consumer(), "member"], "invalid-decorator-target"],
      [[() => {}], "invalid-decorator-target"],
      [[Consumer, undefined, -1], "invalid-decorator-location"],
      [[Consumer, undefined, 0.5], "invalid-decorator-location"],
      [[Consumer, undefined, Infinity], "invalid-decorator-location"],
      [[Consumer, undefined, NaN], "invalid-decorator-location"],
      [[Consumer, undefined, Number.MAX_SAFE_INTEGER + 1], "invalid-decorator-location"],
      [[Consumer, "prototype"], "invalid-decorator-location"],
      [[Consumer.prototype, undefined, 0], "invalid-decorator-location"],
      [[Consumer.prototype], "invalid-decorator-location"],
      [[Consumer, {}], "invalid-decorator-location"],
      [[Consumer, "member", null], "invalid-decorator-location"],
      [[Consumer, undefined], "invalid-decorator-location"],
      [[Consumer, "member", {}, "extra"], "invalid-decorator-location"],
    ];
    for (const [arguments_, code] of cases) {
      expect(() => Reflect.apply(callback, undefined, arguments_)).toThrow(MetadataBoundaryError);
      expect(() => Reflect.apply(callback, undefined, arguments_)).toThrowError(
        expect.objectContaining({ name: "MetadataBoundaryError", code }),
      );
      expect(metadata.read(Consumer)).toEqual({ isValid: true, isPresent: true, value: "old" });
    }
  });

  it("preserves safe error categories and explicit causes without consumer data", () => {
    const cause = new Error("inspection");
    const error = new MetadataBoundaryError("invalid-decorator-target", { cause });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("MetadataBoundaryError");
    expect(error.code).toBe("invalid-decorator-target");
    expect(error.cause).toBe(cause);
    expect(error.message).toBe("Metadata boundary rejected: invalid-decorator-target");
    expect(new MetadataBoundaryError("invalid-decorator-location").cause).toBeUndefined();
  });

  it("keeps inspection and snapshot exceptions observable without changing existing annotations", () => {
    /** Target retaining prior annotations during exceptional snapshot checks. */
    class Consumer {}
    const metadata = new ValueMetadataDefinition<string>("inspection");
    metadata.set(Consumer, "old");
    const failure = new Error("inspection failed");
    const proxy = new Proxy(
      {},
      {
        getOwnPropertyDescriptor: () => {
          throw failure;
        },
      },
    );
    expect(() => metadata.decorator("new")(proxy, "member")).toThrow(failure);
    expect(metadata.read(Consumer)).toEqual({ isValid: true, isPresent: true, value: "old" });
    const record = new RecordMetadataDefinition<string>("snapshot");
    record.decorator({ entry: "old" })(Consumer);
    const input = {
      /**
       * Throws the captured inspection failure when snapshotting reads this entry.
       * @returns Never returns; every read throws the captured failure.
       * @throws {Error} Whenever snapshot preparation evaluates the getter.
       */
      get entry(): string {
        throw failure;
      },
    };
    expect(() => record.decorator(input)).toThrow(failure);
    expect(record.read(Consumer)).toEqual({
      isValid: true,
      isPresent: true,
      value: { entry: "old" },
    });
  });
});
