// @scenario SCH-130
// @scenario SCH-131
// @scenario SCH-132
import { describe, expect, it } from "vitest";
import {
  Schema,
  IsString,
  IsNumber,
  IsBoolean,
  IsInt,
  IsEnum,
  IsLiteral,
  IsDate,
  IsArray,
  IsTuple,
  IsSet,
  IsMap,
  IsRecord,
  IsObject,
  IsAny,
  IsOneOf,
  IsUnion,
  Optional,
  Nullable,
  Default,
  Transform,
  Rename,
  Refine,
} from "../../../index.js";
import { OutboundScenario } from "../../support/OutboundScenario.js";

describe("SCH-130 recursive logical-to-wire projection", () => {
  it("reads logical names, strips uninspected extras and copies shared nested values independently", () => {
    /** Child DTO with a wire alias. */
    class Child {
      /** Logical name serialized under the `wireName` key. */
      public name!: string;
    }
    IsString()(Child.prototype, "name");
    Rename("wireName")(Child.prototype, "name");
    /** Response containing every supported collection representation. */
    class Response {}
    IsObject(Child)(Response.prototype, "child");
    Rename("wireChild")(Response.prototype, "child");
    IsArray(Child)(Response.prototype, "array");
    IsTuple([Child, Number])(Response.prototype, "tuple");
    IsSet(Child)(Response.prototype, "set");
    IsMap(String, Child)(Response.prototype, "map");
    IsRecord(Child)(Response.prototype, "record");
    IsDate()(Response.prototype, "date");
    let callbacks = 0;
    const child = {
      name: "Ada",
      extra: "secret",
      toJSON: () => {
        callbacks++;
        return "bad";
      },
    };
    Object.defineProperty(child, "dropped", {
      enumerable: true,
      get: () => {
        callbacks++;
        throw new Error("bad");
      },
    });
    const input = {
      child,
      array: [child],
      tuple: [child, 2],
      set: new Set([child]),
      map: new Map([["a", child]]),
      record: { a: child },
      date: new Date("2026-10-31T00:00:00Z"),
    };
    const result = Schema.safeSerialize(Response, input);
    expect(result).toEqual({
      ok: true,
      value: {
        wireChild: { wireName: "Ada" },
        array: [{ wireName: "Ada" }],
        tuple: [{ wireName: "Ada" }, 2],
        set: [{ wireName: "Ada" }],
        map: { a: { wireName: "Ada" } },
        record: { a: { wireName: "Ada" } },
        date: "2026-10-31T00:00:00.000Z",
      },
    });
    expect(callbacks).toBe(0);
    if (!result.ok) throw new Error("Expected projection");
    expect(JSON.parse(JSON.stringify(result.value))).toEqual(result.value);
    child.name = "changed";
    expect(result.value).toMatchObject({ wireChild: { wireName: "Ada" } });
    expect(Schema.safeSerialize(Response, { ...input, child: { wireName: "Ada" } })).toMatchObject({
      ok: false,
      issues: [{ path: ["child", "name"], code: "invalid_type" }],
    });
  });

  it("accepts scalar constraints, null, any JSON, empty objects and safe prototype-related wire names", () => {
    for (const [value, decorator] of [
      [true, IsBoolean()],
      [1, IsInt()],
      [1.5, IsNumber()],
      ["a", IsEnum(["a"])],
      [null, IsLiteral(null)],
      ["x", IsLiteral("x")],
    ] as const) {
      expect(OutboundScenario.serialize(value, decorator)).toEqual({ ok: true, value: { value } });
    }
    expect(
      OutboundScenario.serialize({ nested: [null, true, 1, "a", Object.create(null)] }, IsAny()).ok,
    ).toBe(true);
    expect(OutboundScenario.serialize("x", IsString(), Rename("__proto__"))).toEqual({
      ok: true,
      value: JSON.parse('{"__proto__":"x"}'),
    });
    expect(
      OutboundScenario.serialize(new Map([["__proto__", "x"]]), IsMap(String, String)),
    ).toEqual({ ok: true, value: { value: JSON.parse('{"__proto__":"x"}') } });
    expect(OutboundScenario.serialize([], IsArray(String))).toEqual({
      ok: true,
      value: { value: [] },
    });
    expect(OutboundScenario.serialize({}, IsRecord(String))).toEqual({
      ok: true,
      value: { value: {} },
    });
    expect(
      OutboundScenario.serialize(Object.assign(Object.create(null), { a: "x" }), IsRecord(String)),
    ).toEqual({ ok: true, value: { value: { a: "x" } } });
  });
});

describe("SCH-131 output modifier and refinement direction", () => {
  it("supplies validated nested DTO methods to property refinements and skips nullable/optional checks", () => {
    const order: string[] = [];
    let constructors = 0;
    /** Nested logical DTO methods can inspect validated fields without constructor state. */
    class Child {
      /** Name validated before the nested refinement runs. */
      public name!: string;

      /**
       * Counts explicit construction to prove projection avoids the constructor.
       */
      public constructor() {
        constructors++;
      }

      /**
       * Checks whether the parsed logical name matches the expected user.
       * @returns `true` only when the name is `Ada`.
       */
      public hasName(): boolean {
        return this.name === "Ada";
      }
    }
    IsString()(Child.prototype, "name");
    Rename("wireName")(Child.prototype, "name");
    /** Parent receives a validated nested instance, not raw or already projected wire data. */
    class Parent {}
    IsObject(Child)(Parent.prototype, "child");
    Refine((value) => {
      order.push("property");
      return value instanceof Child && value.hasName();
    })(Parent.prototype, "child");
    IsString()(Parent.prototype, "optional");
    Optional()(Parent.prototype, "optional");
    Refine(() => {
      throw new Error("Must skip absent fields");
    })(Parent.prototype, "optional");
    IsString()(Parent.prototype, "nullable");
    Nullable()(Parent.prototype, "nullable");
    Refine(() => {
      throw new Error("Must skip null fields");
    })(Parent.prototype, "nullable");
    Refine<Parent>(() => {
      order.push("class");
      return true;
    }, {})(Parent);
    expect(Schema.safeSerialize(Parent, { child: { name: "Ada" }, nullable: null })).toEqual({
      ok: true,
      value: { child: { wireName: "Ada" }, nullable: null },
    });
    expect(order).toEqual(["property", "class"]);
    expect(constructors).toBe(0);
    order.length = 0;
    expect(Schema.safeSerialize(Parent, { child: { name: 1 }, nullable: null }).ok).toBe(false);
    expect(order).toEqual([]);
  });
  it("does not execute defaults, transforms or normalization, and keeps input behavior", () => {
    let defaults = 0;
    let transforms = 0;
    /** DTO demonstrating independent input modifiers. */
    class Dto {}
    IsString({ trim: true, lowercase: true })(Dto.prototype, "name");
    Default(() => {
      defaults++;
      return "DEFAULT";
    })(Dto.prototype, "name");
    Transform((value) => {
      transforms++;
      return String(value);
    })(Dto.prototype, "name");
    Rename("alias")(Dto.prototype, "name");
    expect(Schema.safeSerialize(Dto, {})).toMatchObject({
      ok: false,
      issues: [{ path: ["name"], code: "invalid_type" }],
    });
    expect(Schema.safeSerialize(Dto, { name: " ADA " })).toEqual({
      ok: true,
      value: { alias: " ADA " },
    });
    expect([defaults, transforms]).toEqual([0, 0]);
    expect(Schema.safeParse(Dto, {})).toMatchObject({ ok: true, value: { name: "default" } });
    expect([defaults, transforms]).toEqual([1, 1]);
    expect(OutboundScenario.serialize(undefined, IsString(), Optional())).toEqual({
      ok: true,
      value: {},
    });
    expect(OutboundScenario.serialize(null, IsString(), Nullable())).toEqual({
      ok: true,
      value: { value: null },
    });
    expect(OutboundScenario.serialize("1", IsNumber()).ok).toBe(false);
  });

  it("runs property then class checks on validated prototype instances with no constructor effects", () => {
    const order: string[] = [];
    let constructors = 0;
    /** Logical DTO with a public cross-field rule. */
    class Dto {
      /** Logical name read from the `alias` wire key. */
      public name!: string;

      /**
       * Records construction and initializes the logical name for direct callers.
       * @param argument Name stored by direct construction; schema projection skips this constructor.
       */
      public constructor(argument: string) {
        constructors++;
        this.name = argument;
      }
      /**
       * Reads validated logical state, not renamed wire input.
       * @returns Whether the validated name equals `Ada`.
       */
      public isAda(): boolean {
        return this.name === "Ada";
      }
    }
    IsString()(Dto.prototype, "name");
    Rename("alias")(Dto.prototype, "name");
    Refine((value) => {
      order.push("field");
      return value === "Ada";
    }, "must be Ada")(Dto.prototype, "name");
    Refine<Dto>(
      (value) => {
        order.push("class");
        expect(value).toBeInstanceOf(Dto);
        return value.isAda();
      },
      { code: "is_ada" },
    )(Dto);
    expect(Schema.safeSerialize(Dto, { name: "Ada" })).toEqual({
      ok: true,
      value: { alias: "Ada" },
    });
    expect(order).toEqual(["field", "class"]);
    expect(constructors).toBe(0);
    order.length = 0;
    expect(Schema.safeSerialize(Dto, { name: "Bob" })).toMatchObject({
      ok: false,
      issues: [{ path: ["name"], code: "custom", message: "must be Ada" }],
    });
    expect(order).toEqual(["field"]);
    order.length = 0;
    Schema.safeSerialize(Dto, { name: 1 });
    expect(order).toEqual([]);
  });
});

describe("SCH-132 union projection", () => {
  it("uses logical discriminator fields when the input discriminator has a wire alias", () => {
    /** Variant discriminator is read logically on output and emitted under its inbound wire name. */
    class Variant {}
    IsLiteral("v")(Variant.prototype, "kind");
    Rename("wireKind")(Variant.prototype, "kind");
    /** Root with the established input-wire discriminator configuration. */
    class Root {}
    IsUnion({ discriminator: "wireKind", variants: { v: Variant } })(Root);
    expect(Schema.safeParse(Root, { wireKind: "v" })).toMatchObject({
      ok: true,
      value: { kind: "v" },
    });
    expect(Schema.safeSerialize(Root, { kind: "v" })).toEqual({
      ok: true,
      value: { wireKind: "v" },
    });
    expect(Schema.safeSerialize(Root, { wireKind: "v" }).ok).toBe(false);
  });
  it("projects property/root/lazy variants and first matching oneOf without rerunning refinements", () => {
    let checks = 0;
    /** Tagged variant. */
    class Cat {}
    IsLiteral("cat")(Cat.prototype, "kind");
    IsString()(Cat.prototype, "name");
    Rename("wireName")(Cat.prototype, "name");
    Refine<Cat>(() => {
      checks++;
      return true;
    }, {})(Cat);
    const options = { discriminator: "kind", variants: { cat: () => Cat } };
    /** Union root. */
    class Animal {}
    IsUnion(options)(Animal);
    const cat = { kind: "cat", name: "Ada", extra: 1 };
    expect(Schema.safeSerialize(Animal, cat)).toEqual({
      ok: true,
      value: { kind: "cat", wireName: "Ada" },
    });
    expect(checks).toBe(1);
    expect(OutboundScenario.serialize(cat, IsUnion(options))).toEqual({
      ok: true,
      value: { value: { kind: "cat", wireName: "Ada" } },
    });
    expect(OutboundScenario.serialize(cat, IsOneOf([Cat, String])).ok).toBe(true);
    expect(OutboundScenario.serialize("x", IsOneOf([Cat, String]))).toEqual({
      ok: true,
      value: { value: "x" },
    });
    expect(OutboundScenario.serialize(1, IsOneOf([String, Number])).ok).toBe(true);
    expect(OutboundScenario.serialize(true, IsOneOf([String, Number]))).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_union" }],
    });
    expect(Schema.safeSerialize(Animal, { kind: "dog" })).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_discriminator", path: ["kind"] }],
    });
  });
});
