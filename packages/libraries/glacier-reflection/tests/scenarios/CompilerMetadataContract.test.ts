import { describe, expect, it } from "vitest";
import {
  DESIGN_TYPE_METADATA,
  DESIGN_PARAMETER_TYPES_METADATA,
  DESIGN_RETURN_TYPE_METADATA,
  ValueMetadataDefinition,
  MetadataBoundaryError,
  MetadataDiscovery,
  type IRuntimeType,
} from "../../index.js";
import { FreshCompilerRealm } from "../data/FreshCompilerRealm.js";

describe("checked compiler metadata public contract", () => {
  it.each(["invalid-decorator-target", "invalid-decorator-location", "foreign-handler"] as const)(
    "preserves a consumer-thrown %s as an exceptional inspection cause",
    (code) => {
      class Consumer {}
      Reflect.metadata("design:type", Boolean)(Consumer);
      const cause = new MetadataBoundaryError(code, { cause: new Error("private diagnostic") });
      const target = new Proxy(Consumer, {
        getOwnPropertyDescriptor: () => {
          throw cause;
        },
      });
      let failure: unknown;
      try {
        Reflect.metadata("design:type", String)(target);
      } catch (error) {
        failure = error;
      }
      expect(failure).toBeInstanceOf(MetadataBoundaryError);
      expect(failure).toMatchObject({ code: "invalid-decorator-target", cause });
      expect(failure instanceof Error && failure.cause).toBe(cause);
      expect(failure).not.toBe(cause);
      expect(failure instanceof Error && failure.message).not.toContain("private diagnostic");
      expect(DESIGN_TYPE_METADATA.read(Consumer)).toEqual({
        isValid: true,
        isPresent: true,
        value: Boolean,
      });
    },
  );

  it.each(["invalid-decorator-target", "invalid-decorator-location"] as const)(
    "retains %s identity from prototype and repeated owner inspection without invoking getters or bodies",
    (code) => {
      class Consumer {
        public member!: unknown;
      }
      Reflect.metadata("design:type", Boolean)(Consumer.prototype, "member");
      const cause = new MetadataBoundaryError(code);
      const prototype = new Proxy(Consumer.prototype, {
        getOwnPropertyDescriptor: () => {
          throw cause;
        },
      });
      expect(() => Reflect.metadata("design:type", String)(prototype, "member")).toThrowError(
        expect.objectContaining({ code: "invalid-decorator-target", cause }),
      );
      Reflect.metadata("design:type", Boolean)(Consumer);
      let inspections = 0;
      let constructions = 0;
      let getterCalls = 0;
      const canonicalPrototype = {};
      const target = new Proxy(function () {}, {
        getOwnPropertyDescriptor(owner, key) {
          if (key === "prototype") {
            if (++inspections > 1) throw cause;
            return {
              value: canonicalPrototype,
              writable: true,
              configurable: false,
              enumerable: false,
            };
          }
          return Object.getOwnPropertyDescriptor(owner, key);
        },
        construct() {
          constructions++;
          throw new Error("consumer body must not run");
        },
        get() {
          getterCalls++;
          throw new Error("consumer getter must not run");
        },
      });
      Object.defineProperty(canonicalPrototype, "constructor", { value: target });
      let failure: unknown;
      try {
        Reflect.metadata("design:type", String)(target);
      } catch (error) {
        failure = error;
      }
      expect(failure).toBeInstanceOf(MetadataBoundaryError);
      expect(failure instanceof Error && failure.cause).toBe(cause);
      expect(failure).toMatchObject({ code: "invalid-decorator-target" });
      expect(constructions).toBe(0);
      expect(getterCalls).toBe(0);
      expect(DESIGN_TYPE_METADATA.read(Consumer)).toEqual({
        isValid: true,
        isPresent: true,
        value: Boolean,
      });
      expect(DESIGN_TYPE_METADATA.read(Consumer, { kind: "member", member: "member" })).toEqual({
        isValid: true,
        isPresent: true,
        value: Boolean,
      });
    },
  );

  it.each(["invalid-decorator-target", "invalid-decorator-location"] as const)(
    "preserves %s thrown by parameter snapshot getters at the value boundary",
    (code) => {
      class Consumer {}
      Reflect.metadata("design:paramtypes", [Boolean])(Consumer);
      const cause = new MetadataBoundaryError(code);
      const values = [String];
      Object.defineProperty(values, "0", {
        get() {
          throw cause;
        },
      });
      let failure: unknown;
      try {
        Reflect.metadata("design:paramtypes", values)(Consumer);
      } catch (error) {
        failure = error;
      }
      expect(failure).toBeInstanceOf(MetadataBoundaryError);
      expect(failure instanceof Error && failure.cause).toBe(cause);
      expect(failure).toMatchObject({ code: "invalid-compiler-value" });
      expect(DESIGN_PARAMETER_TYPES_METADATA.read(Consumer)).toEqual({
        isValid: true,
        isPresent: true,
        value: [Boolean],
      });
    },
  );

  it("keeps expected compiler target and invocation rejections cause-less, safe and atomic", () => {
    class Consumer {
      public 7!: unknown;
    }
    Reflect.metadata("design:type", Boolean)(Consumer);
    const callback = Reflect.metadata("design:type", String);
    const cases: readonly {
      readonly arguments: readonly unknown[];
      readonly code: "invalid-decorator-target" | "invalid-decorator-location";
    }[] = [
      { arguments: [null], code: "invalid-decorator-target" },
      { arguments: ["private target"], code: "invalid-decorator-target" },
      { arguments: [() => {}], code: "invalid-decorator-target" },
      { arguments: [Consumer.prototype], code: "invalid-decorator-location" },
      {
        arguments: [Consumer, "7", undefined, "private extra"],
        code: "invalid-decorator-location",
      },
      { arguments: [Consumer, undefined, 0], code: "invalid-decorator-location" },
      { arguments: [Consumer, "7", 0], code: "invalid-decorator-location" },
      { arguments: [Consumer, "7", "private descriptor"], code: "invalid-decorator-location" },
      { arguments: [Consumer, "7", null], code: "invalid-decorator-location" },
    ];
    for (const scenario of cases) {
      let failure: unknown;
      try {
        Reflect.apply(callback, undefined, scenario.arguments);
      } catch (error) {
        failure = error;
      }
      expect(failure).toBeInstanceOf(MetadataBoundaryError);
      expect(failure).toMatchObject({ code: scenario.code });
      expect(failure instanceof Error && failure.cause).toBeUndefined();
      expect(failure instanceof Error && failure.message).toBe(
        new MetadataBoundaryError(scenario.code).message,
      );
      expect(DESIGN_TYPE_METADATA.read(Consumer)).toEqual({
        isValid: true,
        isPresent: true,
        value: Boolean,
      });
    }
    Reflect.apply(callback, undefined, [Consumer.prototype, 7, {}]);
    expect(DESIGN_TYPE_METADATA.read(Consumer, { kind: "member", member: 7 })).toEqual({
      isValid: true,
      isPresent: true,
      value: String,
    });
  });

  it("rejects sparse and invalid dense parameter arrays through the source public protocol atomically", () => {
    class Consumer {}
    Reflect.metadata("design:paramtypes", [Boolean])(Consumer);
    const sparse: unknown[] = [];
    sparse.length = 2;
    const inherited = [String, Number];
    Reflect.deleteProperty(inherited, "1");
    Object.setPrototypeOf(inherited, { 1: Number });
    for (const value of [sparse, inherited, [String, {}], String, null]) {
      expect(() => Reflect.metadata("design:paramtypes", value)).toThrowError(
        new MetadataBoundaryError("invalid-compiler-value"),
      );
      expect(DESIGN_PARAMETER_TYPES_METADATA.read(Consumer)).toEqual({
        isValid: true,
        isPresent: true,
        value: [Boolean],
      });
    }
  });

  it("rejects an owner that stops being canonical between callback normalization and storage", () => {
    class Consumer {}
    Reflect.metadata("design:type", Boolean)(Consumer);
    let inspections = 0;
    const prototype = {};
    const owner = new Proxy(function () {}, {
      getOwnPropertyDescriptor(target, key) {
        if (key === "prototype") {
          inspections++;
          return {
            value: inspections > 1 ? null : prototype,
            writable: true,
            configurable: false,
            enumerable: false,
          };
        }
        return Object.getOwnPropertyDescriptor(target, key);
      },
    });
    Object.defineProperty(prototype, "constructor", { value: owner });
    expect(() => Reflect.metadata("design:type", String)(owner)).toThrowError(
      new MetadataBoundaryError("invalid-decorator-location"),
    );
    expect(DESIGN_TYPE_METADATA.read(Consumer)).toEqual({
      isValid: true,
      isPresent: true,
      value: Boolean,
    });
  });

  it("records all supported runtime keys through the mapped public root and preserves definition isolation", () => {
    class Consumer {
      public member!: unknown;
      public static member: unknown;
    }
    const independent = new ValueMetadataDefinition<IRuntimeType>("design:type");
    Reflect.metadata("design:type", String)(Consumer.prototype, "member");
    Reflect.metadata("design:returntype", undefined)(Consumer, "member");
    Reflect.metadata("design:paramtypes", [Number, undefined])(Consumer);
    expect(DESIGN_TYPE_METADATA.read(Consumer, { kind: "member", member: "member" })).toEqual({
      isValid: true,
      isPresent: true,
      value: String,
    });
    expect(
      DESIGN_RETURN_TYPE_METADATA.read(Consumer, {
        kind: "member",
        side: "static",
        member: "member",
      }),
    ).toEqual({
      isValid: true,
      isPresent: true,
      value: undefined,
    });
    expect(DESIGN_PARAMETER_TYPES_METADATA.read(Consumer)).toEqual({
      isValid: true,
      isPresent: true,
      value: [Number, undefined],
    });
    expect(independent.read(Consumer, { kind: "member", member: "member" })).toEqual({
      isValid: true,
      isPresent: false,
    });
    expect(MetadataDiscovery.definitions(Consumer)).toEqual({
      isValid: true,
      definitions: [DESIGN_PARAMETER_TYPES_METADATA],
    });
  });

  it("captures a complete frozen compiler array at factory time while typed decorators retain array identity", () => {
    class Base {}
    class Derived extends Base {}
    const values: IRuntimeType[] = [String, undefined];
    const callback = Reflect.metadata("design:paramtypes", values);
    values[0] = Number;
    callback(Base);
    const read = DESIGN_PARAMETER_TYPES_METADATA.read(Base);
    if (!read.isValid || !read.isPresent) throw new Error("Missing emitted array");
    expect(read.value).toEqual([String, undefined]);
    expect(Object.isFrozen(read.value)).toBe(true);
    expect(read.value).not.toBe(values);
    DESIGN_PARAMETER_TYPES_METADATA.decorator(values)(Derived);
    const direct = DESIGN_PARAMETER_TYPES_METADATA.read(Derived);
    expect(direct.isValid && direct.isPresent && direct.value).toBe(values);
    Reflect.metadata("design:paramtypes", [])(Derived);
    expect(DESIGN_PARAMETER_TYPES_METADATA.read(Derived)).toEqual({
      isValid: true,
      isPresent: true,
      value: [],
    });
  });

  it("preserves causes and old declarations when untrusted inspection or complete snapshot preparation fails", () => {
    class Consumer {}
    DESIGN_PARAMETER_TYPES_METADATA.set(Consumer, [Boolean]);
    const cause = new Error("private diagnostic");
    const values = [String, Number];
    Object.defineProperty(values, "1", {
      get: () => {
        throw cause;
      },
    });
    let failure: unknown;
    try {
      Reflect.metadata("design:paramtypes", values);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(MetadataBoundaryError);
    expect(failure).toMatchObject({ code: "invalid-compiler-value", cause });
    expect(failure instanceof Error && failure.message).not.toContain(cause.message);
    expect(DESIGN_PARAMETER_TYPES_METADATA.read(Consumer)).toEqual({
      isValid: true,
      isPresent: true,
      value: [Boolean],
    });
    const target = new Proxy(Consumer, {
      getOwnPropertyDescriptor: () => {
        throw cause;
      },
    });
    try {
      Reflect.metadata("design:type", String)(target);
    } catch (error) {
      failure = error;
    }
    expect(failure).toMatchObject({ code: "invalid-decorator-target", cause });
    expect(DESIGN_TYPE_METADATA.read(Consumer)).toEqual({ isValid: true, isPresent: false });
  });

  it("rejects immediate unsupported values and invalid callback addresses without changing valid data", () => {
    class Consumer {}
    Reflect.metadata("design:type", String)(Consumer);
    expect(() => Reflect.metadata("secret:key", String)).toThrowError(
      new MetadataBoundaryError("unsupported-compiler-key"),
    );
    expect(() => Reflect.metadata("design:type", "secret:value")).toThrowError(
      new MetadataBoundaryError("invalid-compiler-value"),
    );
    expect(() => Reflect.metadata("design:paramtypes", [String, {}])).toThrowError(
      new MetadataBoundaryError("invalid-compiler-value"),
    );
    expect(() =>
      Reflect.apply(Reflect.metadata("design:returntype", Number), undefined, [{}]),
    ).toThrowError(new MetadataBoundaryError("invalid-decorator-target"));
    expect(() => Reflect.metadata("design:type", Number)(Consumer, "prototype")).toThrowError(
      new MetadataBoundaryError("invalid-decorator-location"),
    );
    expect(() =>
      Reflect.apply(Reflect.metadata("design:type", Number), undefined, [Consumer, undefined, 0]),
    ).toThrowError(new MetadataBoundaryError("invalid-decorator-location"));
    expect(DESIGN_TYPE_METADATA.read(Consumer)).toEqual({
      isValid: true,
      isPresent: true,
      value: String,
    });
  });

  it("automatically records genuine TypeScript emission before decorated declarations run", async () => {
    expect(await FreshCompilerRealm.run("emission")).toEqual([
      { isValid: true, isPresent: true, value: ["String"] },
      { isValid: true, isPresent: true, value: "Number" },
      { isValid: true, isPresent: true, value: "Function" },
      { isValid: true, isPresent: true, value: ["Boolean"] },
      { isValid: true, isPresent: true, value: "String" },
    ]);
  });

  it("replaces scalar and whole parameter declarations, including empty and unavailable values", async () => {
    expect(await FreshCompilerRealm.run("replacement")).toEqual([
      { isValid: true, isPresent: true, value: "Number" },
      { isValid: true, isPresent: true, value: [] },
      { isValid: true, isPresent: true, value: "<unavailable>" },
      { isValid: true, isPresent: true, value: [] },
    ]);
  });

  it("snapshots and freezes only compiler-ingested parameter arrays", async () => {
    expect(await FreshCompilerRealm.run("snapshot")).toEqual({
      value: ["String", "<unavailable>"],
      frozen: true,
      independent: true,
      mutationRejected: true,
      after: { isValid: true, isPresent: true, value: ["String", "<unavailable>"] },
    });
  });

  it("predefined constants retain ordinary value-definition identity, operations and direct array ownership", () => {
    class Consumer {
      public member!: string;
    }
    const values: IRuntimeType[] = [String];
    const unrelated = new ValueMetadataDefinition<unknown>("design:type");
    for (const definition of [DESIGN_TYPE_METADATA, DESIGN_RETURN_TYPE_METADATA]) {
      expect(definition).toBeInstanceOf(ValueMetadataDefinition);
      expect(definition.kind).toBe("value");
      expect(definition.set(Consumer, String)).toEqual({ isValid: true });
      expect(definition.read(new Consumer())).toEqual({
        isValid: true,
        isPresent: true,
        value: String,
      });
      expect(definition.has(Consumer)).toEqual({ isValid: true, isPresent: true });
      expect(definition.locations(Consumer)).toEqual({
        isValid: true,
        addresses: [{ kind: "class" }],
      });
      expect(definition.delete(Consumer)).toEqual({ isValid: true, isDeleted: true });
      expect(definition.read(Consumer)).toEqual({ isValid: true, isPresent: false });
      definition.decorator(undefined)(Consumer.prototype, "member");
      expect(definition.read(Consumer, { kind: "member", member: "member" })).toEqual({
        isValid: true,
        isPresent: true,
        value: undefined,
      });
    }
    expect(unrelated.read(Consumer, { kind: "member", member: "member" })).toEqual({
      isValid: true,
      isPresent: false,
    });
    expect(DESIGN_PARAMETER_TYPES_METADATA).toBeInstanceOf(ValueMetadataDefinition);
    expect(DESIGN_PARAMETER_TYPES_METADATA.kind).toBe("value");
    expect(DESIGN_PARAMETER_TYPES_METADATA.set(Consumer, values)).toEqual({ isValid: true });
    const read = DESIGN_PARAMETER_TYPES_METADATA.read(Consumer);
    expect(read.isValid && read.isPresent && read.value).toBe(values);
    values.push(Number);
    expect(DESIGN_PARAMETER_TYPES_METADATA.read(Consumer)).toEqual({
      isValid: true,
      isPresent: true,
      value: [String, Number],
    });
  });

  for (const index of [0, 1, 2]) {
    const shapes =
      index === 1
        ? ["scalar", "object", "null", "dense", "sparse", "hole"]
        : ["null", "object", "number", "string", "array"];
    for (const shape of shapes) {
      it(`rejects key ${index} malformed ${shape} without replacing the valid declaration`, async () => {
        const result = await FreshCompilerRealm.run(`value:${index}:${shape}`);
        expect(result).toMatchObject({
          installed: true,
          rejection: { code: "invalid-compiler-value", isBoundaryError: true },
          oldDeclarationPreserved: true,
        });
      });
    }
    for (const shape of ["instance", "plain", "arrow"]) {
      it(`rejects key ${index} ${shape} targets atomically`, async () => {
        expect(await FreshCompilerRealm.run(`target:${index}:${shape}`)).toMatchObject({
          installed: true,
          rejection: { code: "invalid-decorator-target", isBoundaryError: true },
          oldDeclarationPreserved: true,
        });
      });
    }
    for (const shape of ["parameter", "prototype", "object"]) {
      it(`rejects key ${index} unsupported ${shape} locations atomically`, async () => {
        expect(await FreshCompilerRealm.run(`location:${index}:${shape}`)).toMatchObject({
          installed: true,
          rejection: { code: "invalid-decorator-location", isBoundaryError: true },
          oldDeclarationPreserved: true,
        });
      });
    }
    it(`accepts key ${index} supported unavailable runtime representations`, async () => {
      const result = await FreshCompilerRealm.run(`valid:${index}:supported`);
      expect(result).toEqual({
        isValid: true,
        isPresent: true,
        value: index === 1 ? ["Object", "Function", "<unavailable>", ""] : "<unavailable>",
      });
    });
    for (const shape of ["string", "symbol"]) {
      it(`rejects unknown ${shape} keys without changing key ${index} declarations`, async () => {
        expect(await FreshCompilerRealm.run(`key:${index}:${shape}`)).toMatchObject({
          installed: true,
          rejection: { code: "unsupported-compiler-key", isBoundaryError: true },
          oldDeclarationPreserved: true,
        });
      });
    }
  }
});
