// @scenario SCH-090
// @scenario SCH-091
// @scenario SCH-092
// @scenario SCH-093
// @scenario SCH-094
// @scenario SCH-095
import { describe, expect, it } from "vitest";
import {
  IsInt,
  IsLiteral,
  IsObject,
  IsOneOf,
  IsString,
  IsUnion,
  Nullable,
  Optional,
  Rename,
  SchemaDefinitionError,
  parse,
  safeParse,
} from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

class Cat {
  public type!: "cat";
  public lives!: number;
  public meow(): string {
    return "meow";
  }
}
FieldDeclaration.declare(Cat, "type", String, IsLiteral("cat"));
FieldDeclaration.declare(Cat, "lives", Number, IsInt({ min: 1 }));

class Dog {
  public type!: "dog";
  public name!: string;
}
FieldDeclaration.declare(Dog, "type", String, IsLiteral("dog"));
FieldDeclaration.declare(Dog, "name", String, IsString({ min: 2 }), Rename("dogName"));

class Owner {
  public pet!: Cat | Dog;
  public alias?: Cat | Dog;
}
FieldDeclaration.declare(
  Owner,
  "pet",
  Object,
  IsUnion({ discriminator: "type", variants: { cat: Cat, dog: () => Dog } }),
);
FieldDeclaration.declare(
  Owner,
  "alias",
  Object,
  IsUnion({ discriminator: "type", variants: { cat: Cat, dog: Dog } }, { message: "bad pet" }),
  Optional(),
);

describe("SCH-090 Discriminated union fields", () => {
  it("selects the variant by the discriminator and returns its instance", () => {
    const cat = parse(Owner, { pet: { type: "cat", lives: 9, extra: 1 } });
    const dog = parse(Owner, { pet: { type: "dog", dogName: "Rex" } });

    expect(cat.pet).toBeInstanceOf(Cat);
    expect(Object.keys(cat.pet)).toEqual(["type", "lives"]);
    expect(dog.pet).toBeInstanceOf(Dog);
    expect(dog.pet).toMatchObject({ name: "Rex" });
  });

  it("reports variant issues at the variant's fields with its aliases and messages", () => {
    const result = safeParse(Owner, { pet: { type: "dog", dogName: "R" } });

    expect(!result.ok && result.issues).toEqual([
      {
        path: ["pet", "dogName"],
        code: "too_small",
        message: expect.any(String),
        params: expect.any(Object),
      },
    ]);
  });

  it("accepts a missing optional union and rejects non-objects", () => {
    expect(parse(Owner, { pet: { type: "cat", lives: 1 } }).alias).toBeUndefined();
    for (const pet of [null, 1, "cat", ["cat"]]) {
      const result = safeParse(Owner, { pet });
      expect(!result.ok && result.issues.map((issue) => [issue.path, issue.code])).toEqual([
        [["pet"], "invalid_type"],
      ]);
    }
  });

  it("does not select inherited property names as variants", () => {
    const result = safeParse(Owner, { pet: { type: "constructor" } });

    expect(!result.ok && result.issues[0]?.code).toBe("invalid_discriminator");
  });
});

describe("SCH-091 Unknown or missing discriminator", () => {
  it("reports invalid_discriminator at the discriminator property", () => {
    const unknown = safeParse(Owner, { pet: { type: "bird" } });
    const missing = safeParse(Owner, { pet: { lives: 1 } });
    const wrongType = safeParse(Owner, { pet: { type: 3 } });

    expect(!unknown.ok && unknown.issues).toEqual([
      {
        path: ["pet", "type"],
        code: "invalid_discriminator",
        message: 'Invalid discriminator "bird" for "type", expected one of: "cat", "dog"',
        params: { discriminator: "type", expected: ["cat", "dog"], received: "bird" },
      },
    ]);
    expect(!missing.ok && missing.issues[0]).toMatchObject({
      path: ["pet", "type"],
      code: "invalid_discriminator",
      message: 'Missing discriminator "type", expected one of: "cat", "dog"',
    });
    expect(!wrongType.ok && wrongType.issues[0]?.code).toBe("invalid_discriminator");
  });

  it("applies the field message to discriminator issues but not to variant issues", () => {
    const discriminator = safeParse(Owner, { pet: { type: "cat", lives: 1 }, alias: {} });
    const variant = safeParse(Owner, { pet: { type: "cat", lives: 1 }, alias: { type: "cat" } });

    expect(!discriminator.ok && discriminator.issues[0]?.message).toBe("bad pet");
    expect(!variant.ok && variant.issues[0]?.message).not.toBe("bad pet");
  });
});

describe("SCH-092 Union options and nesting", () => {
  it("coerces inside the selected variant", () => {
    const owner = parse(Owner, { pet: { type: "cat", lives: "9" } }, { coerce: true });

    expect(owner.pet).toMatchObject({ lives: 9 });
    expect(safeParse(Owner, { pet: { type: "cat", lives: "9" } }).ok).toBe(false);
  });

  it("counts the selected variant as a nesting level", () => {
    const shallow = safeParse(Owner, { pet: { type: "cat", lives: 1 } }, { maxDepth: 1 });

    expect(!shallow.ok && shallow.issues[0]).toMatchObject({
      path: ["pet"],
      code: "max_depth_exceeded",
    });
    expect(safeParse(Owner, { pet: { type: "cat", lives: 1 } }, { maxDepth: 2 }).ok).toBe(true);
  });
});

abstract class Animal {}
class Bird extends Animal {
  public wings!: number;
}
FieldDeclaration.declare(Bird, "wings", Number, IsInt());
class Fish extends Animal {
  public fins!: number;
  public kind!: string;
}
FieldDeclaration.declare(Fish, "fins", Number, IsInt());
FieldDeclaration.declare(Fish, "kind", String, IsString(), Optional());
IsUnion({ discriminator: "kind", variants: { bird: Bird, fish: () => Fish } })(Animal);

describe("SCH-093 Discriminated union on a base class", () => {
  it("parses the base class into the selected subclass instance", () => {
    const bird = parse(Animal as unknown as new () => Animal, { kind: "bird", wings: 2 });

    expect(bird).toBeInstanceOf(Bird);
    expect(bird).toMatchObject({ wings: 2 });
  });

  it("locates top-level issues from the root", () => {
    const base = Animal as unknown as new () => Animal;
    const unknown = safeParse(base, { kind: "cow" });
    const variant = safeParse(base, { kind: "bird", wings: 1.5 });
    const notObject = safeParse(base, []);

    expect(!unknown.ok && unknown.issues[0]).toMatchObject({
      path: ["kind"],
      code: "invalid_discriminator",
    });
    expect(!variant.ok && variant.issues[0]).toMatchObject({
      path: ["wings"],
      code: "invalid_type",
    });
    expect(!notObject.ok && notObject.issues[0]).toMatchObject({ path: [], code: "invalid_type" });
  });

  it("parses lazily referenced variants and reports their optional fields", () => {
    const fish = parse(Animal as unknown as new () => Animal, { kind: "fish", fins: 2 });

    expect(fish).toBeInstanceOf(Fish);
  });

  it("applies the class message to discriminator issues only", () => {
    class Pet {}
    IsUnion({ discriminator: "type", variants: { cat: Cat } }, { message: "pick a pet" })(Pet);
    const base = Pet as unknown as new () => Pet;
    const unknown = safeParse(base, { type: "x" });
    const variant = safeParse(base, { type: "cat", lives: 0 });

    expect(!unknown.ok && unknown.issues[0]?.message).toBe("pick a pet");
    expect(!variant.ok && variant.issues[0]?.message).not.toBe("pick a pet");
  });

  it("does not make the variants themselves unions", () => {
    expect(safeParse(Bird, { wings: 2 }).ok).toBe(true);
  });

  it("keeps the root depth: the variant is the root", () => {
    const base = Animal as unknown as new () => Animal;

    expect(safeParse(base, { kind: "bird", wings: 2 }, { maxDepth: 1 }).ok).toBe(true);
  });
});

class Box {
  public value!: string | number | Cat;
  public maybe!: string | number | null;
  public flag?: boolean | number;
}
FieldDeclaration.declare(Box, "value", Object, IsOneOf([String, Number, Cat]));
FieldDeclaration.declare(
  Box,
  "maybe",
  Object,
  IsOneOf([String, Number], { message: "nope" }),
  Nullable(),
);
FieldDeclaration.declare(Box, "flag", Object, IsOneOf([Boolean, Number]), Optional());

describe("SCH-094 Non-discriminated unions", () => {
  it("accepts the first matching option", () => {
    const text = parse(Box, { value: "a", maybe: null });
    const cat = parse(Box, { value: { type: "cat", lives: 2 }, maybe: 1 });

    expect(text.value).toBe("a");
    expect(cat.value).toBeInstanceOf(Cat);
  });

  it("reports one invalid_union issue with the attempts of every option", () => {
    const result = safeParse(Box, { value: true, maybe: "x" });

    expect(!result.ok && result.issues).toEqual([
      {
        path: ["value"],
        code: "invalid_union",
        message: "Value does not match any of the allowed types",
        params: {
          attempts: [
            [expect.objectContaining({ path: [], code: "invalid_type" })],
            [expect.objectContaining({ path: [], code: "invalid_type" })],
            [expect.objectContaining({ path: [], code: "invalid_type" })],
          ],
        },
      },
    ]);
  });

  it("keeps variant issue paths inside the attempts and honours message overrides", () => {
    const result = safeParse(Box, { value: { type: "cat", lives: 0 }, maybe: {} });

    expect(!result.ok && result.issues[0]?.params).toEqual({
      attempts: [
        expect.anything(),
        expect.anything(),
        [expect.objectContaining({ path: ["lives"], code: "too_small" })],
      ],
    });
    expect(!result.ok && result.issues[1]?.message).toBe("nope");
  });

  it("tries exact matches before coercion and coerces only when nothing matches", () => {
    const exact = parse(Box, { value: 5, maybe: "5" }, { coerce: true });
    const coerced = parse(Box, { value: "x", maybe: null, flag: "true" }, { coerce: true });
    const strict = safeParse(Box, { value: "x", maybe: null, flag: "true" });

    expect(exact.value).toBe(5);
    expect(exact.maybe).toBe("5");
    expect(coerced.flag).toBe(true);
    expect(strict.ok).toBe(false);
  });

  it("reports invalid_union when coercion does not help either", () => {
    const result = safeParse(Box, { value: {}, maybe: [] }, { coerce: true });

    expect(!result.ok && result.issues.map((issue) => issue.code)).toEqual([
      "invalid_union",
      "invalid_union",
    ]);
  });

  it("does not coerce null or undefined into a match", () => {
    const result = safeParse(Box, { value: null, maybe: null }, { coerce: true });

    expect(!result.ok && result.issues.map((issue) => issue.code)).toEqual(["invalid_union"]);
  });
});

describe("SCH-095 Union declaration", () => {
  const reject = (declare: () => void): void => expect(declare).toThrow(SchemaDefinitionError);

  it("rejects invalid mappings", () => {
    class Target {
      public x!: unknown;
    }
    reject(() =>
      FieldDeclaration.declare(
        Target,
        "x",
        Object,
        IsUnion({ discriminator: "", variants: { a: Cat } }),
      ),
    );
    reject(() => IsUnion({ discriminator: "t", variants: {} })(Target.prototype, "x"));
    reject(() => IsUnion({ discriminator: "t", variants: null as never })(Target.prototype, "x"));
    reject(() =>
      IsUnion({ discriminator: "t", variants: { a: 1 as never } })(Target.prototype, "x"),
    );
    reject(() => IsUnion({ discriminator: "t", variants: { a: Target } })(Target));
    reject(() => IsOneOf([String])(Target.prototype, "x"));
    reject(() => IsOneOf([String, "x" as never])(Target.prototype, "x"));
  });

  it("rejects a second type decorator and a second class union", () => {
    class Twice {
      public x!: unknown;
    }
    IsOneOf([String, Number])(Twice.prototype, "x");
    reject(() => IsObject(Cat)(Twice.prototype, "x"));
    reject(() => IsUnion({ discriminator: "t", variants: { a: Cat } })(Twice.prototype, "x"));
    class Base {}
    IsUnion({ discriminator: "t", variants: { a: Cat } })(Base);
    reject(() => IsUnion({ discriminator: "t", variants: { b: Cat } })(Base));
  });

  it("freezes unions and rejects class decoration after the first parse", () => {
    class Late {}
    IsUnion({ discriminator: "type", variants: { cat: Cat } })(Late);
    safeParse(Late as unknown as new () => Late, { type: "cat", lives: 1 });
    reject(() => IsUnion({ discriminator: "type", variants: { cat: Cat } })(Late));
  });

  it("reports a variant reference that is not a class when first used", () => {
    class Holder {
      public x!: unknown;
    }
    FieldDeclaration.declare(
      Holder,
      "x",
      Object,
      IsUnion({ discriminator: "t", variants: { a: (() => 1) as never } }),
    );

    expect(() => safeParse(Holder, { x: { t: "a" } })).toThrow(SchemaDefinitionError);
  });
});
