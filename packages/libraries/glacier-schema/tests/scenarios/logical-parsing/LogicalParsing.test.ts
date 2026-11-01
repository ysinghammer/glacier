import { describe, expect, it } from "vitest";
import {
  Default,
  IsArray,
  IsBigInt,
  IsDate,
  IsInt,
  IsLiteral,
  IsMap,
  IsObject,
  IsOneOf,
  IsRecord,
  IsSet,
  IsString,
  IsTuple,
  IsUnion,
  Optional,
  PartialType,
  Refine,
  Rename,
  Schema,
  SchemaDefinitionError,
  Transform,
} from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

/** Native nested value with a distinct logical and wire field name. */
class Child {
  /** Logical display name normalized on input. */
  public displayName!: string;
  /** Big integer retained as a native value. */
  public count!: bigint;
  /** Date retained as a native value. */
  public date!: Date;
}
FieldDeclaration.declare(
  Child,
  "displayName",
  String,
  IsString({ trim: true }),
  Rename("display_name"),
);
FieldDeclaration.declare(Child, "count", BigInt, IsBigInt());
FieldDeclaration.declare(Child, "date", Date, IsDate());

/** Collection fixture exercising nested logical schemas in every supported container. */
class Containers {
  /** Nested object. */
  public child!: Child;
  /** Nested object array. */
  public array!: Child[];
  /** Nested object tuple. */
  public tuple!: [Child];
  /** Nested object set. */
  public set!: Set<Child>;
  /** Nested object map key and value. */
  public map!: Map<Child, Child>;
  /** Nested object dictionary value. */
  public record!: Record<string, Child>;
  /** Non-discriminated nested alternative. */
  public choice!: string | Child;
}
FieldDeclaration.declare(Containers, "child", Child, IsObject(Child), Rename("wire_child"));
FieldDeclaration.declare(Containers, "array", Array, IsArray(Child));
FieldDeclaration.declare(Containers, "tuple", Array, IsTuple([Child]));
FieldDeclaration.declare(Containers, "set", Set, IsSet(Child));
FieldDeclaration.declare(Containers, "map", Map, IsMap(Child, Child));
FieldDeclaration.declare(Containers, "record", Object, IsRecord(Child));
FieldDeclaration.declare(Containers, "choice", Object, IsOneOf([String, Child]));

/** Cat variant using its own logical discriminator name. */
class Cat {
  /** Cat discriminator, renamed on the wire. */
  public catKind!: "cat";
  /** Renamed payload. */
  public name!: string;
}
FieldDeclaration.declare(Cat, "catKind", String, IsLiteral("cat"), Rename("type"));
FieldDeclaration.declare(Cat, "name", String, IsString(), Rename("cat_name"));

/** Dog variant using a different logical discriminator name. */
class Dog {
  /** Dog discriminator, renamed on the wire. */
  public dogKind!: "dog";
  /** Numeric dog payload. */
  public age!: number;
}
FieldDeclaration.declare(Dog, "dogKind", String, IsLiteral("dog"), Rename("type"));
FieldDeclaration.declare(Dog, "age", Number, IsInt());

/** Root union selecting a cat or dog. */
class Animal {}
IsUnion({ discriminator: "type", variants: { cat: Cat, dog: () => Dog } })(Animal);

/** Field union and nested root union. */
class Owner {
  /** Field union selected by logical discriminator. */
  public pet!: Cat | Dog;
  /** Root union nested within a class. */
  public animal!: Animal;
}
FieldDeclaration.declare(
  Owner,
  "pet",
  Object,
  IsUnion({ discriminator: "type", variants: { cat: Cat, dog: () => Dog } }),
);
FieldDeclaration.declare(Owner, "animal", Animal, IsObject(Animal));

/** A root union wrapping another root union. */
class WrappedAnimal {}
IsUnion({ discriminator: "type", variants: { cat: Animal, dog: Animal } })(WrappedAnimal);

/** Fixture with inbound transformations, defaults and class and property refinements. */
class Rules {
  /** Normalized name with property refinement. */
  public name!: string;
  /** Defaulted counter. */
  public count!: number;
  /** A transformed optional field. */
  public note?: string;
}
FieldDeclaration.declare(
  Rules,
  "name",
  String,
  IsString({ trim: true, min: 2 }),
  Rename("wire_name"),
  Refine((value) => value !== "bad", "bad name"),
);
FieldDeclaration.declare(Rules, "count", Number, IsInt(), Default(3));
FieldDeclaration.declare(
  Rules,
  "note",
  String,
  IsString(),
  Optional(),
  Transform((value) => String(value).toUpperCase()),
);
Refine<Rules>((value) => value.name !== "blocked", { message: "blocked name" })(Rules);

describe("logical parsing", () => {
  it("parses nested logical values across native collections without JSON projection", () => {
    const date = new Date("2024-01-02T00:00:00Z");
    const child = { displayName: " Ada ", count: 4n, date };
    const array = [child];
    const result = Schema.safeParseLogical(Containers, {
      child,
      array,
      tuple: [child],
      set: new Set([child]),
      map: new Map([[child, child]]),
      record: { entry: child },
      choice: child,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected success");
    const mapEntry = [...result.value.map][0];
    const values = [
      result.value.child,
      result.value.array[0],
      result.value.tuple[0],
      [...result.value.set][0],
      mapEntry?.[0],
      mapEntry?.[1],
      result.value.record.entry,
      result.value.choice,
    ];
    for (const value of values) {
      expect(value).toBeInstanceOf(Child);
      expect(value).toMatchObject({ displayName: "Ada", count: 4n, date });
    }
    expect(result.value.child.date).toBe(date);
    expect(result.value.array).not.toBe(array);
  });

  it("reports logical paths for failures at nested collection and class fields", () => {
    const child = { displayName: 1, count: "wrong", date: new Date("invalid") };
    const result = Schema.safeParseLogical(Containers, {
      child,
      array: [child],
      tuple: [],
      set: new Set(),
      map: new Map(),
      record: {},
      choice: "ok",
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure");
    expect(result.issues.map((issue) => issue.path)).toEqual([
      ["child", "displayName"],
      ["child", "count"],
      ["child", "date"],
      ["array", 0, "displayName"],
      ["array", 0, "count"],
      ["array", 0, "date"],
      ["tuple"],
    ]);
  });

  it("preserves wire parsing independently of the logical mode and cache order", () => {
    const logical = { name: " Ada ", count: 1 };
    const wire = { wire_name: " Ada ", count: 1 };
    expect(Schema.safeParseLogical(Rules, logical)).toMatchObject({
      ok: true,
      value: { name: "Ada" },
    });
    expect(Schema.safeParse(Rules, wire)).toMatchObject({ ok: true, value: { name: "Ada" } });
    expect(Schema.safeParse(Rules, logical)).toMatchObject({
      ok: false,
      issues: [{ path: ["wire_name"] }],
    });
    expect(Schema.safeParseLogical(Rules, wire)).toMatchObject({
      ok: false,
      issues: [{ path: ["name"] }],
    });
  });

  it("applies defaults, transforms, field and class refinements and partial semantics", () => {
    expect(Schema.safeParseLogical(Rules, { name: " Ada ", note: "hello" })).toMatchObject({
      ok: true,
      value: { name: "Ada", count: 3, note: "HELLO" },
    });
    expect(Schema.safeParseLogical(Rules, { name: "bad" })).toMatchObject({
      ok: false,
      issues: [{ path: ["name"] }],
    });
    expect(Schema.safeParseLogical(Rules, { name: "blocked" })).toMatchObject({
      ok: false,
      issues: [{ message: "blocked name" }],
    });
    const partial = PartialType(Rules);
    expect(Schema.safeParseLogical(partial, { name: "blocked" })).toMatchObject({
      ok: true,
      value: { name: "blocked" },
    });
    expect(Schema.safeParseLogical(partial, {})).toMatchObject({ ok: true, value: {} });
    expect(Schema.safeParseLogical(partial, { name: "bad" }).ok).toBe(false);
  });

  it("keeps nested defaults and class refinements in shallow partials", () => {
    /** Patch source with a complete nested object. */
    class Parent {
      /** Nested schema subject to its own full validation. */
      public child!: Rules;
    }
    FieldDeclaration.declare(Parent, "child", Rules, IsObject(Rules));
    const patch = PartialType(Parent);
    expect(Schema.safeParseLogical(patch, { child: { name: "Ada" } })).toMatchObject({
      ok: true,
      value: { child: { name: "Ada", count: 3 } },
    });
    expect(Schema.safeParseLogical(patch, { child: { name: "blocked" } })).toMatchObject({
      ok: false,
      issues: [{ path: ["child"], message: "blocked name" }],
    });
    expect(Schema.safeParseLogical(patch, { child: {} })).toMatchObject({
      ok: false,
      issues: [{ path: ["child", "name"] }],
    });
  });

  it("propagates coercion, singleton-array and maximum-depth options", () => {
    /** Holder for an integer array and nested value. */
    class Options {
      /** Integers with singleton coercion. */
      public numbers!: number[];
      /** Nested native value. */
      public child!: Child;
    }
    FieldDeclaration.declare(Options, "numbers", Array, IsArray(Number));
    FieldDeclaration.declare(Options, "child", Child, IsObject(Child));
    const input = { numbers: "2", child: { displayName: "x", count: "4", date: "2024-01-02" } };
    expect(Schema.safeParseLogical(Options, input).ok).toBe(false);
    expect(
      Schema.safeParseLogical(Options, input, { coerce: true, coerceSingletonArrays: true }),
    ).toMatchObject({
      ok: true,
      value: { numbers: [2], child: { count: 4n, date: new Date("2024-01-02") } },
    });
    expect(
      Schema.safeParseLogical(Options, input, {
        coerce: true,
        coerceSingletonArrays: true,
        maxDepth: 1,
      }),
    ).toMatchObject({
      ok: false,
      issues: [{ path: ["child"], code: "max_depth_exceeded" }],
    });
  });

  it("dispatches field, nested and root unions by each variant's logical discriminator", () => {
    const cat = { catKind: "cat", name: "Milo" };
    const dog = { dogKind: "dog", age: 2 };
    const owner = Schema.safeParseLogical(Owner, { pet: cat, animal: dog });
    expect(owner).toMatchObject({ ok: true, value: { pet: cat, animal: dog } });
    expect(Schema.safeParseLogical(Animal, cat)).toMatchObject({ ok: true, value: cat });
    expect(Schema.safeParseLogical(WrappedAnimal, dog)).toMatchObject({ ok: true, value: dog });
    expect(Schema.safeParse(Animal, { type: "cat", cat_name: "Milo" })).toMatchObject({
      ok: true,
      value: { name: "Milo" },
    });
  });

  it("rejects ambiguous, missing, invalid and mismatched logical discriminator properties", () => {
    const ambiguous = Schema.safeParseLogical(Animal, {
      catKind: "cat",
      dogKind: "dog",
      name: "Milo",
      age: 2,
    });
    expect(ambiguous).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_discriminator", params: { properties: ["catKind", "dogKind"] } }],
    });
    expect(Schema.safeParseLogical(Animal, {})).toMatchObject({
      ok: false,
      issues: [
        { path: [], code: "invalid_discriminator", params: { properties: ["catKind", "dogKind"] } },
      ],
    });
    expect(Schema.safeParseLogical(Animal, { catKind: "bird" })).toMatchObject({
      ok: false,
      issues: [{ path: ["catKind"], code: "invalid_discriminator" }],
    });
    expect(Schema.safeParseLogical(Animal, { catKind: "dog" })).toMatchObject({
      ok: false,
      issues: [{ path: ["catKind"], code: "invalid_discriminator" }],
    });
    expect(Schema.safeParseLogical(Animal, [])).toMatchObject({
      ok: false,
      issues: [{ path: [], code: "invalid_type" }],
    });
    expect(
      Schema.safeParseLogical(Owner, {
        pet: { catKind: "cat", dogKind: "dog" },
        animal: { dogKind: "dog", age: 2 },
      }),
    ).toMatchObject({ ok: false, issues: [{ path: ["pet"], code: "invalid_discriminator" }] });
    expect(Schema.safeParseLogical(Animal, { dogKind: undefined })).toMatchObject({
      ok: false,
      issues: [{ path: ["dogKind"], code: "invalid_discriminator" }],
    });
  });

  it("resolves all union variant references before accepting a logical discriminator", () => {
    /** Union with a valid selected variant and an invalid unused lazy reference. */
    class Root {}
    IsUnion({ discriminator: "type", variants: { cat: Cat, bad: (() => 1) as never } })(Root);
    expect(Schema.safeParse(Root, { type: "cat", cat_name: "Milo" }).ok).toBe(true);
    expect(() => Schema.safeParseLogical(Root, { catKind: "cat", name: "Milo" })).toThrow(
      SchemaDefinitionError,
    );
  });

  it.each([null, undefined, 1, "invalid", () => {}])(
    "rejects malformed lazy union prototypes during root and field logical parsing: %s",
    (prototype) => {
      const malformed = Cat.bind(null);
      Object.defineProperty(malformed, "prototype", { value: prototype });
      /** Root union with a malformed lazy variant. */
      class Root {}
      IsUnion({ discriminator: "type", variants: { cat: Cat, bad: () => malformed } })(Root);
      /** Object containing a field union with the same malformed variant. */
      class Parent {
        /** Nested discriminated value. */
        public pet!: Cat;
      }
      FieldDeclaration.declare(
        Parent,
        "pet",
        Object,
        IsUnion({ discriminator: "type", variants: { cat: Cat, bad: () => malformed } }),
      );
      for (const input of [{ catKind: "cat", name: "Milo" }, { type: "bad" }]) {
        expect(() => Schema.safeParseLogical(Root, input)).toThrow(SchemaDefinitionError);
        expect(() => Schema.safeParseLogical(Parent, { pet: input })).toThrow(
          SchemaDefinitionError,
        );
      }
    },
  );

  it("rejects lazy targets without an own data prototype without invoking accessors", () => {
    const accessorTarget = Cat.bind(null);
    let reads = 0;
    Object.defineProperty(accessorTarget, "prototype", {
      get: () => {
        reads += 1;
        return Cat.prototype;
      },
    });
    for (const resolve of [() => accessorTarget, () => (() => {}) as never]) {
      /** Root union whose invalid lazy variant is not selected. */
      class Root {}
      IsUnion({ discriminator: "type", variants: { cat: Cat, bad: resolve } })(Root);
      expect(() => Schema.safeParseLogical(Root, { catKind: "cat", name: "Milo" })).toThrow(
        SchemaDefinitionError,
      );
    }
    expect(reads).toBe(0);
  });

  it("supports variants without a declared discriminator field and freezes parsed metadata", () => {
    /** Variant without a declared discriminator property. */
    class Variant {
      /** Required value in the selected variant. */
      public name!: string;
    }
    FieldDeclaration.declare(Variant, "name", String, IsString());
    /** Root union using an undeclared discriminator property. */
    class Root {}
    IsUnion({ discriminator: "type", variants: { item: Variant } })(Root);
    expect(Schema.safeParseLogical(Root, { type: "item", name: "ok" })).toMatchObject({
      ok: true,
      value: { name: "ok" },
    });
    expect(() => IsString()(Variant.prototype, "late")).toThrow(SchemaDefinitionError);
  });

  it("reports invalid lazy variants and non-progressing root-union cycles as schema errors", () => {
    /** Root with an invalid lazy class reference. */
    class Invalid {}
    IsUnion({ discriminator: "type", variants: { bad: (() => 1) as never } })(Invalid);
    expect(() => Schema.safeParseLogical(Invalid, { type: "bad" })).toThrow(SchemaDefinitionError);
    /** Root union that delegates back to itself through another root union. */
    class First {}
    /** Other half of a non-progressing union cycle. */
    class Second {}
    IsUnion({ discriminator: "type", variants: { first: () => Second } })(First);
    IsUnion({ discriminator: "type", variants: { first: () => First } })(Second);
    expect(() => Schema.safeParseLogical(First, { type: "first" })).toThrow(SchemaDefinitionError);
  });
});
