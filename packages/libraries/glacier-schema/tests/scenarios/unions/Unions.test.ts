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
  Schema,
} from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

/** Cat variant used to verify discriminator selection and nested validation. */
class Cat {
  /** Literal discriminator selecting the cat variant. */
  public type!: "cat";
  /** Positive remaining-life count validated as an integer. */
  public lives!: number;

  /**
   * Produces the sound used to confirm parsed instances retain their behavior.
   * @returns The cat's sound.
   */
  public meow(): string {
    return "meow";
  }
}
FieldDeclaration.declare(Cat, "type", String, IsLiteral("cat"));
FieldDeclaration.declare(Cat, "lives", Number, IsInt({ min: 1 }));

/** Dog variant whose logical name is read through an input alias. */
class Dog {
  /** Literal discriminator selecting the dog variant. */
  public type!: "dog";
  /** Dog name read from the `dogName` input key. */
  public name!: string;
}
FieldDeclaration.declare(Dog, "type", String, IsLiteral("dog"));
FieldDeclaration.declare(Dog, "name", String, IsString({ min: 2 }), Rename("dogName"));

/** Parent fixture with required and optional discriminated union fields. */
class Owner {
  /** Required pet selected by its `type` discriminator. */
  public pet!: Cat | Dog;
  /** Optional union alias used to check field-specific error messages. */
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
    const cat = Schema.parse(Owner, { pet: { type: "cat", lives: 9, extra: 1 } });
    const dog = Schema.parse(Owner, { pet: { type: "dog", dogName: "Rex" } });

    expect(cat.pet).toBeInstanceOf(Cat);
    expect(Object.keys(cat.pet)).toEqual(["type", "lives"]);
    expect(dog.pet).toBeInstanceOf(Dog);
    expect(dog.pet).toMatchObject({ name: "Rex" });
  });

  it("reports variant issues at the variant's fields with its aliases and messages", () => {
    const result = Schema.safeParse(Owner, { pet: { type: "dog", dogName: "R" } });

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
    expect(Schema.parse(Owner, { pet: { type: "cat", lives: 1 } }).alias).toBeUndefined();
    for (const pet of [null, 1, "cat", ["cat"]]) {
      const result = Schema.safeParse(Owner, { pet });
      expect(!result.ok && result.issues.map((issue) => [issue.path, issue.code])).toEqual([
        [["pet"], "invalid_type"],
      ]);
    }
  });

  it("does not select inherited property names as variants", () => {
    const result = Schema.safeParse(Owner, { pet: { type: "constructor" } });

    expect(!result.ok && result.issues[0]?.code).toBe("invalid_discriminator");
  });
});

describe("SCH-091 Unknown or missing discriminator", () => {
  it("reports invalid_discriminator at the discriminator property", () => {
    const unknown = Schema.safeParse(Owner, { pet: { type: "bird" } });
    const missing = Schema.safeParse(Owner, { pet: { lives: 1 } });
    const wrongType = Schema.safeParse(Owner, { pet: { type: 3 } });

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
    const discriminator = Schema.safeParse(Owner, { pet: { type: "cat", lives: 1 }, alias: {} });
    const variant = Schema.safeParse(Owner, {
      pet: { type: "cat", lives: 1 },
      alias: { type: "cat" },
    });

    expect(!discriminator.ok && discriminator.issues[0]?.message).toBe("bad pet");
    expect(!variant.ok && variant.issues[0]?.message).not.toBe("bad pet");
  });
});

describe("SCH-092 Union options and nesting", () => {
  it("coerces inside the selected variant", () => {
    const owner = Schema.parse(Owner, { pet: { type: "cat", lives: "9" } }, { coerce: true });

    expect(owner.pet).toMatchObject({ lives: 9 });
    expect(Schema.safeParse(Owner, { pet: { type: "cat", lives: "9" } }).ok).toBe(false);
  });

  it("counts the selected variant as a nesting level", () => {
    const shallow = Schema.safeParse(Owner, { pet: { type: "cat", lives: 1 } }, { maxDepth: 1 });

    expect(!shallow.ok && shallow.issues[0]).toMatchObject({
      path: ["pet"],
      code: "max_depth_exceeded",
    });
    expect(Schema.safeParse(Owner, { pet: { type: "cat", lives: 1 } }, { maxDepth: 2 }).ok).toBe(
      true,
    );
  });
});

/** Base type whose union parser selects one concrete animal subclass. */
abstract class Animal {}
/** Bird union variant with an integer wing count. */
class Bird extends Animal {
  /** Number of wings validated as an integer. */
  public wings!: number;
}
FieldDeclaration.declare(Bird, "wings", Number, IsInt());
/** Fish union variant with required fins and an optional kind field. */
class Fish extends Animal {
  /** Number of fins validated as an integer. */
  public fins!: number;
  /** Optional discriminator value accepted for the fish variant. */
  public kind!: string;
}
FieldDeclaration.declare(Fish, "fins", Number, IsInt());
FieldDeclaration.declare(Fish, "kind", String, IsString(), Optional());
IsUnion({ discriminator: "kind", variants: { bird: Bird, fish: () => Fish } })(Animal);

describe("SCH-093 Discriminated union on a base class", () => {
  it("parses the base class into the selected subclass instance", () => {
    const bird = Schema.parse(Animal as unknown as new () => Animal, { kind: "bird", wings: 2 });

    expect(bird).toBeInstanceOf(Bird);
    expect(bird).toMatchObject({ wings: 2 });
  });

  it("locates top-level issues from the root", () => {
    const base = Animal as unknown as new () => Animal;
    const unknown = Schema.safeParse(base, { kind: "cow" });
    const variant = Schema.safeParse(base, { kind: "bird", wings: 1.5 });
    const notObject = Schema.safeParse(base, []);

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
    const fish = Schema.parse(Animal as unknown as new () => Animal, { kind: "fish", fins: 2 });

    expect(fish).toBeInstanceOf(Fish);
  });

  it("applies the class message to discriminator issues only", () => {
    /** Empty class receiving the tested class-level union decorator. */
    class Pet {}
    IsUnion({ discriminator: "type", variants: { cat: Cat } }, { message: "pick a pet" })(Pet);
    const base = Pet as unknown as new () => Pet;
    const unknown = Schema.safeParse(base, { type: "x" });
    const variant = Schema.safeParse(base, { type: "cat", lives: 0 });

    expect(!unknown.ok && unknown.issues[0]?.message).toBe("pick a pet");
    expect(!variant.ok && variant.issues[0]?.message).not.toBe("pick a pet");
  });

  it("does not make the variants themselves unions", () => {
    expect(Schema.safeParse(Bird, { wings: 2 }).ok).toBe(true);
  });

  it("keeps the root depth: the variant is the root", () => {
    const base = Animal as unknown as new () => Animal;

    expect(Schema.safeParse(base, { kind: "bird", wings: 2 }, { maxDepth: 1 }).ok).toBe(true);
  });
});

/** Fixture with ordinary unions and nullable/optional union members. */
class Box {
  /** Union value whose first matching option is retained. */
  public value!: string | number | Cat;
  /** Nullable union used to test explicit null and message overrides. */
  public maybe!: string | number | null;
  /** Optional union that accepts a missing field. */
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
    const text = Schema.parse(Box, { value: "a", maybe: null });
    const cat = Schema.parse(Box, { value: { type: "cat", lives: 2 }, maybe: 1 });

    expect(text.value).toBe("a");
    expect(cat.value).toBeInstanceOf(Cat);
  });

  it("reports one invalid_union issue with the attempts of every option", () => {
    const result = Schema.safeParse(Box, { value: true, maybe: "x" });

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
    const result = Schema.safeParse(Box, { value: { type: "cat", lives: 0 }, maybe: {} });

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
    const exact = Schema.parse(Box, { value: 5, maybe: "5" }, { coerce: true });
    const coerced = Schema.parse(Box, { value: "x", maybe: null, flag: "true" }, { coerce: true });
    const strict = Schema.safeParse(Box, { value: "x", maybe: null, flag: "true" });

    expect(exact.value).toBe(5);
    expect(exact.maybe).toBe("5");
    expect(coerced.flag).toBe(true);
    expect(strict.ok).toBe(false);
  });

  it("reports invalid_union when coercion does not help either", () => {
    const result = Schema.safeParse(Box, { value: {}, maybe: [] }, { coerce: true });

    expect(!result.ok && result.issues.map((issue) => issue.code)).toEqual([
      "invalid_union",
      "invalid_union",
    ]);
  });

  it("does not coerce null or undefined into a match", () => {
    const result = Schema.safeParse(Box, { value: null, maybe: null }, { coerce: true });

    expect(!result.ok && result.issues.map((issue) => issue.code)).toEqual(["invalid_union"]);
  });
});

describe("SCH-095 Union declaration", () => {
  /**
   * Asserts that a declaration callback throws the schema definition error.
   * @param declare Callback expected to fail during decorator application.
   * @returns Nothing; forwards the assertion failure to the test runner.
   */
  const reject = (declare: () => void): void => expect(declare).toThrow(SchemaDefinitionError);

  it("rejects invalid mappings", () => {
    /** Target used to exercise malformed field- and class-level union declarations. */
    class Target {
      /** Undeclared fixture member receiving invalid union decorators. */
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
    /** Fixture used to verify duplicate field and class union declarations fail. */
    class Twice {
      /** Member on which duplicate type-decorator declarations are rejected. */
      public x!: unknown;
    }
    IsOneOf([String, Number])(Twice.prototype, "x");
    reject(() => IsObject(Cat)(Twice.prototype, "x"));
    reject(() => IsUnion({ discriminator: "t", variants: { a: Cat } })(Twice.prototype, "x"));
    /** Class receiving the first class-level union declaration. */
    class Base {}
    IsUnion({ discriminator: "t", variants: { a: Cat } })(Base);
    reject(() => IsUnion({ discriminator: "t", variants: { b: Cat } })(Base));
  });

  it("freezes unions and rejects class decoration after the first parse", () => {
    /** Class whose union declaration freezes after its first parse. */
    class Late {}
    IsUnion({ discriminator: "type", variants: { cat: Cat } })(Late);
    Schema.safeParse(Late as unknown as new () => Late, { type: "cat", lives: 1 });
    reject(() => IsUnion({ discriminator: "type", variants: { cat: Cat } })(Late));
  });

  it("reports a variant reference that is not a class when first used", () => {
    /** Fixture with an invalid lazy union variant reference. */
    class Holder {
      /** Field with a lazy variant reference resolving to a non-class value. */
      public x!: unknown;
    }
    FieldDeclaration.declare(
      Holder,
      "x",
      Object,
      IsUnion({ discriminator: "t", variants: { a: (() => 1) as never } }),
    );

    expect(() => Schema.safeParse(Holder, { x: { t: "a" } })).toThrow(SchemaDefinitionError);
  });
});
