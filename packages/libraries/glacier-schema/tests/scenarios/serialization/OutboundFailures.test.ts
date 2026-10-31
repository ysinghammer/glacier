// @scenario SCH-135
// @scenario SCH-136
import { describe, expect, it } from "vitest";
import {
  Schema,
  IsAny,
  IsArray,
  IsBigInt,
  IsDate,
  IsMap,
  IsObject,
  IsRecord,
  IsSet,
  IsString,
  IsTuple,
  IsNumber,
  IsUnion,
  IsLiteral,
  Refine,
  Optional,
} from "../../../index.js";
import { OutboundScenario } from "../../support/OutboundScenario.js";

describe("SCH-135 safe outbound failures", () => {
  it("rejects forged native collection/Date prototypes through typed issues instead of native brand exceptions", () => {
    for (const [prototype, decorator] of [
      [Date.prototype, IsDate()],
      [Map.prototype, IsMap(String, String)],
      [Set.prototype, IsSet(String)],
    ] as const) {
      expect(OutboundScenario.serialize(Object.create(prototype), decorator)).toMatchObject({
        ok: false,
        issues: [{ code: "invalid_type", path: ["value"] }],
      });
    }
  });
  it("rejects unsafe/non-JSON values with value-free codes and never invokes getters/toJSON", () => {
    /** Arbitrary instances have no JSON encoder contract. */
    class Unsupported {}
    for (const value of [
      undefined,
      1n,
      NaN,
      Infinity,
      -Infinity,
      Symbol("secret"),
      () => "secret",
      new Unsupported(),
      new Date(),
      new Set(),
      new Map(),
    ]) {
      expect(OutboundScenario.serialize(value, IsAny())).toMatchObject({
        ok: false,
        issues: [{ path: ["value"], code: "invalid_json_value", params: {} }],
      });
    }
    expect(OutboundScenario.serialize(1n, IsBigInt())).toMatchObject({
      ok: false,
      issues: [{ path: ["value"], code: "invalid_json_value", params: {} }],
    });
    expect(OutboundScenario.serialize(NaN, IsNumber())).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_type" }],
    });
    expect(OutboundScenario.serialize(new Date(NaN), IsDate())).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_date" }],
    });
    expect(OutboundScenario.serialize("2026-10-31", IsDate())).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_type" }],
    });
    let calls = 0;
    const record = Object.defineProperty({}, "secret", {
      enumerable: true,
      get: () => {
        calls++;
        return "secret";
      },
    });
    const array = Object.defineProperty(["x"], "0", {
      enumerable: true,
      get: () => {
        calls++;
        return "secret";
      },
    });
    for (const [value, decorator, path] of [
      [record, IsAny(), ["value", "secret"]],
      [record, IsRecord(String), ["value", "secret"]],
      [array, IsArray(String), ["value", 0]],
      [array, IsAny(), ["value", 0]],
    ] as const) {
      expect(OutboundScenario.serialize(value, decorator)).toMatchObject({
        ok: false,
        issues: [{ code: "unsafe_accessor", path }],
      });
    }
    /** Declared properties are inspected without accessing getters. */
    class Dto {}
    IsString()(Dto.prototype, "name");
    expect(
      Schema.safeSerialize(
        Dto,
        Object.defineProperty({}, "name", {
          get: () => {
            calls++;
            return "x";
          },
        }),
      ),
    ).toMatchObject({ ok: false, issues: [{ code: "unsafe_accessor", path: ["name"] }] });
    for (const value of [undefined, null, [], "secret"])
      expect(Schema.safeSerialize(Dto, value)).toMatchObject({
        ok: false,
        issues: [{ code: "invalid_type", path: [] }],
      });
    expect(
      OutboundScenario.serialize(
        {
          toJSON: () => {
            calls++;
            return "secret";
          },
        },
        IsAny(),
      ).ok,
    ).toBe(false);
    expect(calls).toBe(0);
  });

  it("checks collection representations, element failures, sparse arrays and non-string map keys", () => {
    for (const [value, decorator] of [
      ["x", IsArray(String)],
      [null, IsSet(String)],
      [1, IsMap(String, String)],
      [false, IsRecord(String)],
      [{}, IsArray(String)],
      [[], IsMap(String, String)],
      [new Date(), IsRecord(String)],
      [new Set(), IsTuple([String])],
    ] as const) {
      expect(OutboundScenario.serialize(value, decorator).ok).toBe(false);
    }
    expect(OutboundScenario.serialize([1], IsArray(String))).toMatchObject({
      ok: false,
      issues: [{ path: ["value", 0], code: "invalid_type" }],
    });
    expect(OutboundScenario.serialize(Array.from({ length: 1 }), IsArray(String)).ok).toBe(false);
    expect(OutboundScenario.serialize(Array.from({ length: 1 }), IsAny()).ok).toBe(false);
    expect(OutboundScenario.serialize(new Set([1]), IsSet(String)).ok).toBe(false);
    expect(OutboundScenario.serialize(new Map([[1, "x"]]), IsMap(Number, String))).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_json_value" }],
    });
    expect(OutboundScenario.serialize(new Map([["a", 1]]), IsMap(String, String)).ok).toBe(false);
    expect(OutboundScenario.serialize({ a: 1 }, IsRecord(String)).ok).toBe(false);
    expect(OutboundScenario.serialize(["x", "x"], IsArray(String, { unique: true })).ok).toBe(
      false,
    );
    expect(OutboundScenario.serialize([], IsArray(String, { min: 1 })).ok).toBe(false);
    expect(OutboundScenario.serialize(["x", "y"], IsArray(String, { max: 1 })).ok).toBe(false);
  });

  it("uses intrinsic Date and collection methods, not consumer overrides", () => {
    let calls = 0;
    const date = new Date("2026-10-31T00:00:00Z");
    date.getTime = () => {
      calls++;
      throw new Error("secret");
    };
    date.toJSON = () => {
      calls++;
      throw new Error("secret");
    };
    const set = new Set(["x"]);
    const map = new Map([["a", "x"]]);
    set[Symbol.iterator] = () => {
      calls++;
      throw new Error("secret");
    };
    map[Symbol.iterator] = () => {
      calls++;
      throw new Error("secret");
    };
    expect(OutboundScenario.serialize(date, IsDate())).toEqual({
      ok: true,
      value: { value: "2026-10-31T00:00:00.000Z" },
    });
    expect(OutboundScenario.serialize(set, IsSet(String))).toEqual({
      ok: true,
      value: { value: ["x"] },
    });
    expect(OutboundScenario.serialize(map, IsMap(String, String))).toEqual({
      ok: true,
      value: { value: { a: "x" } },
    });
    expect(calls).toBe(0);
  });

  it("rejects cycles while allowing shared references, and bounds noncyclic recursion", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(OutboundScenario.serialize(cyclic, IsAny())).toMatchObject({
      ok: false,
      issues: [{ code: "cyclic_value", path: ["value", "self"] }],
    });
    /** Recursive DTO for class and collection ancestry. */
    class Node {}
    IsObject(() => Node)(Node.prototype, "next");
    Optional()(Node.prototype, "next");
    IsArray(() => Node)(Node.prototype, "children");
    Optional()(Node.prototype, "children");
    expect(Schema.safeSerialize(Node, { next: cyclic }).ok).toBe(true);
    const node: Record<string, unknown> = {};
    node.next = node;
    expect(Schema.safeSerialize(Node, node)).toMatchObject({
      ok: false,
      issues: [{ code: "cyclic_value", path: ["next"] }],
    });
    node.next = undefined;
    node.children = [node];
    expect(Schema.safeSerialize(Node, node)).toMatchObject({
      ok: false,
      issues: [{ code: "cyclic_value", path: ["children", 0] }],
    });
    const collection: unknown[] = [];
    const child = { children: collection };
    collection.push(child);
    expect(Schema.safeSerialize(Node, { children: collection })).toMatchObject({
      ok: false,
      issues: [{ code: "cyclic_value" }],
    });
    let deep: object = {};
    for (let index = 0; index < 70; index++) deep = { next: deep };
    expect(Schema.safeSerialize(Node, deep)).toMatchObject({
      ok: false,
      issues: [{ code: "max_depth_exceeded" }],
    });
    expect(OutboundScenario.serialize(deep, IsAny())).toMatchObject({
      ok: false,
      issues: [{ code: "max_depth_exceeded" }],
    });
    let collectionDeep: object = {};
    for (let index = 0; index < 40; index++) collectionDeep = { children: [collectionDeep] };
    expect(Schema.safeSerialize(Node, collectionDeep)).toMatchObject({
      ok: false,
      issues: [{ code: "max_depth_exceeded" }],
    });
  });
});

describe("SCH-136 refinement failure diagnostics", () => {
  it("retains typed JSON safety when callbacks introduce forged native prototypes", () => {
    for (const prototype of [Date.prototype, Map.prototype, Set.prototype]) {
      /** Refinement mutation cannot turn a successful result into an uncaught native brand exception. */
      class Dto {
        public value: unknown;
      }
      IsAny()(Dto.prototype, "value");
      Refine<Dto>((value) => {
        value.value = Object.create(prototype);
        return true;
      }, {})(Dto);
      expect(Schema.safeSerialize(Dto, { value: "x" })).toMatchObject({
        ok: false,
        issues: [{ code: "invalid_type", path: ["value"] }],
      });
    }
  });
  it("allows adapters to retain useful path/code diagnostics while omitting private values and reasons", () => {
    const result = OutboundScenario.serialize(
      "private-value",
      IsString(),
      Refine(() => {
        throw new Error("private-reason");
      }, "private-message"),
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected typed issues");
    const safe = result.issues.map(({ path, code }) => ({ path, code }));
    expect(safe).toEqual([{ path: ["value"], code: "custom" }]);
    expect(JSON.stringify(safe)).not.toContain("private");
    expect(result.issues).toMatchObject([{ params: { reason: "private-reason" } }]);
  });
  it("prevents class refinement when a declared field has a non-JSON logical type", () => {
    let checks = 0;
    /** Bigint input validation succeeds, but bigint cannot be an outbound JSON field. */
    class Dto {}
    IsBigInt()(Dto.prototype, "value");
    Refine<Dto>(() => {
      checks++;
      return true;
    }, {})(Dto);
    expect(Schema.safeSerialize(Dto, { value: 1n })).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_json_value", path: ["value"] }],
    });
    expect(checks).toBe(0);
  });
  it("translates false and thrown property/class refinements without invoking class checks after fields fail", () => {
    for (const thrown of [new Error("private reason"), "private reason"]) {
      expect(
        OutboundScenario.serialize(
          "x",
          IsString(),
          Refine(() => {
            throw thrown;
          }, "field rule"),
        ),
      ).toMatchObject({
        ok: false,
        issues: [{ code: "custom", message: "field rule", params: { reason: "private reason" } }],
      });
      /** Class rule can fail with diagnostic detail; HTTP must redact it. */
      class Dto {}
      IsString()(Dto.prototype, "name");
      Refine<Dto>(
        () => {
          throw thrown;
        },
        { path: ["name"], message: "class rule", code: "rule" },
      )(Dto);
      expect(Schema.safeSerialize(Dto, { name: "x" })).toMatchObject({
        ok: false,
        issues: [
          {
            code: "rule",
            path: ["name"],
            message: "class rule",
            params: { reason: "private reason" },
          },
        ],
      });
    }
    /** Default class refinement diagnostics. */
    class Rejected {}
    Refine<Rejected>(() => false, {})(Rejected);
    expect(Schema.safeSerialize(Rejected, {})).toEqual({
      ok: false,
      issues: [{ code: "custom", path: [], message: "Refinement failed", params: {} }],
    });
    /** Private brands do not exist on constructor-free validation instances. */
    class Branded {
      private secret = true;
      /** This method intentionally requires a constructor-installed brand. */
      public check(): boolean {
        return this.secret;
      }
    }
    Refine<Branded>((value) => value.check(), {})(Branded);
    expect(Schema.safeSerialize(Branded, {}).ok).toBe(false);
    expect(
      OutboundScenario.serialize(
        "x",
        IsString(),
        Refine(() => {
          throw new Error("x");
        }),
      ).ok,
    ).toBe(false);
  });

  it("rejects unsafe mutations made by successful consumer refinements before returning JSON", () => {
    /** A callback can mutate validated logical data; final projection still checks JSON safety. */
    class Dto {
      public value: unknown;
    }
    IsAny()(Dto.prototype, "value");
    Refine<Dto>((value) => {
      Object.defineProperty(value, "value", {
        get: () => {
          throw new Error("must not execute");
        },
      });
      return true;
    }, {})(Dto);
    expect(Schema.safeSerialize(Dto, { value: "x" })).toMatchObject({
      ok: false,
      issues: [{ code: "unsafe_accessor", path: ["value"] }],
    });
    /** Date state is validated again during the final projection. */
    class Dates {
      public value!: Date;
    }
    IsDate()(Dates.prototype, "value");
    Refine<Dates>((value) => {
      value.value.setTime(NaN);
      return true;
    }, {})(Dates);
    expect(Schema.safeSerialize(Dates, { value: new Date() })).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_date" }],
    });
    /** Map keys must remain strings at the final JSON boundary. */
    class Maps {
      public value!: Map<unknown, string>;
    }
    IsMap(String, String)(Maps.prototype, "value");
    Refine<Maps>((value) => {
      value.value.set(1, "x");
      return true;
    }, {})(Maps);
    expect(Schema.safeSerialize(Maps, { value: new Map() })).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_json_value" }],
    });
    /** Undeclared JSON accessor contents are inspected safely too. */
    class Arrays {
      public value!: unknown[];
    }
    IsArray(String)(Arrays.prototype, "value");
    Refine<Arrays>((value) => {
      Object.defineProperty(value.value, "0", {
        get: () => {
          throw new Error("must not execute");
        },
      });
      return true;
    }, {})(Arrays);
    expect(Schema.safeSerialize(Arrays, { value: ["x"] })).toMatchObject({
      ok: false,
      issues: [{ code: "unsafe_accessor" }],
    });
  });

  it("does not invoke union discriminator getters", () => {
    /** Tagged variant metadata. */
    class Variant {}
    IsLiteral("v")(Variant.prototype, "kind");
    /** Discriminated root. */
    class Root {}
    IsUnion({ discriminator: "kind", variants: { v: Variant } })(Root);
    let calls = 0;
    const input = Object.defineProperty({}, "kind", {
      get: () => {
        calls++;
        return "v";
      },
    });
    expect(Schema.safeSerialize(Root, input)).toMatchObject({
      ok: false,
      issues: [{ code: "unsafe_accessor", path: ["kind"] }],
    });
    expect(Schema.safeSerialize(Root, null).ok).toBe(false);
    expect(Schema.safeSerialize(Root, {}).ok).toBe(false);
    expect(calls).toBe(0);
  });
});
