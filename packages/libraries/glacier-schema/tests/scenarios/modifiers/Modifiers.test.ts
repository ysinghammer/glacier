// @scenario SCH-050
// @scenario SCH-051
// @scenario SCH-052
// @scenario SCH-053
// @scenario SCH-054
// @scenario SCH-055
// @scenario SCH-056
import { describe, expect, it } from "vitest";
import {
  Default,
  IsAny,
  IsInt,
  IsString,
  Nullable,
  Optional,
  Rename,
  SchemaDefinitionError,
  Transform,
  Schema,
} from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

describe("SCH-050 Optional", () => {
  it("accepts a missing or undefined value and keeps the key absent", () => {
    class Profile {
      public nickname?: string;
    }
    FieldDeclaration.declare(Profile, "nickname", String, Optional(), IsString());

    const missing = Schema.parse(Profile, {});
    const undef = Schema.parse(Profile, { nickname: undefined });
    const present = Schema.parse(Profile, { nickname: "Ada" });

    expect(Object.keys(missing)).toEqual([]);
    expect(Object.keys(undef)).toEqual([]);
    expect(present.nickname).toBe("Ada");
  });

  it("still validates present values and rejects null", () => {
    class Profile {
      public nickname?: string;
    }
    FieldDeclaration.declare(Profile, "nickname", String, IsString(), Optional());

    expect(Schema.safeParse(Profile, { nickname: 5 })).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_type", params: { expected: "string", received: "number" } }],
    });
    expect(Schema.safeParse(Profile, { nickname: null })).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_type", params: { received: "null" } }],
    });
  });
});

describe("SCH-051 Nullable", () => {
  it("accepts null and keeps it, while undefined stays invalid", () => {
    class Profile {
      public bio!: string | null;
    }
    FieldDeclaration.declare(Profile, "bio", Object, Nullable(), IsString({ min: 3 }));

    const parsed = Schema.parse(Profile, { bio: null });

    expect(parsed.bio).toBeNull();
    expect(Object.keys(parsed)).toEqual(["bio"]);
    expect(Schema.parse(Profile, { bio: "long enough" }).bio).toBe("long enough");
    expect(Schema.safeParse(Profile, {})).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_type", params: { received: "undefined" } }],
    });
    expect(Schema.safeParse(Profile, { bio: "ab" })).toMatchObject({
      issues: [{ code: "too_small" }],
    });
  });

  it("combines with Optional to accept both null and undefined", () => {
    class Profile {
      public bio?: string | null;
    }
    FieldDeclaration.declare(Profile, "bio", Object, Nullable(), Optional(), IsString());

    expect(Object.keys(Schema.parse(Profile, {}))).toEqual([]);
    expect(Schema.parse(Profile, { bio: null }).bio).toBeNull();
  });
});

describe("SCH-052 Default", () => {
  it("replaces a missing or undefined value and makes the field optional on input", () => {
    class Settings {
      public theme!: string;
    }
    FieldDeclaration.declare(Settings, "theme", String, IsString(), Default("light"));

    expect(Schema.parse(Settings, {}).theme).toBe("light");
    expect(Schema.parse(Settings, { theme: undefined }).theme).toBe("light");
    expect(Schema.parse(Settings, { theme: "dark" }).theme).toBe("dark");
  });

  it("does not replace null", () => {
    class Settings {
      public theme!: string;
    }
    FieldDeclaration.declare(Settings, "theme", String, IsString(), Default("light"));

    expect(Schema.safeParse(Settings, { theme: null })).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_type", params: { received: "null" } }],
    });
  });

  it("calls a factory once per parse, so mutable defaults are not shared", () => {
    let calls = 0;
    class Settings {
      public tags!: unknown;
    }
    FieldDeclaration.declare(
      Settings,
      "tags",
      Object,
      IsAny(),
      Default(() => {
        calls += 1;
        return [];
      }),
    );

    const first = Schema.parse(Settings, {});
    const second = Schema.parse(Settings, {});

    expect(calls).toBe(2);
    expect(first.tags).toEqual([]);
    expect(first.tags).not.toBe(second.tags);
  });

  it("validates the default like any other value", () => {
    class Settings {
      public retries!: number;
    }
    FieldDeclaration.declare(Settings, "retries", Number, IsInt({ min: 1 }), Default(0));

    expect(Schema.safeParse(Settings, {})).toMatchObject({ issues: [{ code: "too_small" }] });
  });

  it("is invalid when a factory yields undefined for a required field", () => {
    class Settings {
      public theme!: string;
    }
    FieldDeclaration.declare(
      Settings,
      "theme",
      String,
      IsString(),
      Default(() => undefined),
    );

    expect(Schema.safeParse(Settings, {})).toMatchObject({ ok: false });
  });
});

describe("SCH-053 Rename", () => {
  it("reads the input key, writes the property name and reports paths by input key", () => {
    class Signup {
      public firstName!: string;
      public age!: number;
    }
    FieldDeclaration.declare(Signup, "firstName", String, IsString(), Rename("first_name"));
    FieldDeclaration.declare(Signup, "age", Number, IsInt());

    const parsed = Schema.parse(Signup, { first_name: "Ada", firstName: "ignored", age: 3 });
    const failed = Schema.safeParse(Signup, { firstName: "Ada", age: 3 });

    expect(Object.keys(parsed)).toEqual(["firstName", "age"]);
    expect(parsed.firstName).toBe("Ada");
    expect(failed).toMatchObject({ ok: false, issues: [{ path: ["first_name"] }] });
  });

  it("supports swapped aliases between fields", () => {
    class Pair {
      public a!: string;
      public b!: string;
    }
    FieldDeclaration.declare(Pair, "a", String, IsString(), Rename("b"));
    FieldDeclaration.declare(Pair, "b", String, IsString(), Rename("a"));

    const parsed = Schema.parse(Pair, { a: "for b", b: "for a" });

    expect([parsed.a, parsed.b]).toEqual(["for a", "for b"]);
  });

  it("rejects an empty key when decorating", () => {
    class Signup {
      public name!: string;
    }

    expect(() => FieldDeclaration.declare(Signup, "name", String, IsString(), Rename(""))).toThrow(
      SchemaDefinitionError,
    );
  });

  it("rejects two fields reading the same input key on first parse", () => {
    class Clash {
      public a!: string;
      public b!: string;
    }
    FieldDeclaration.declare(Clash, "a", String, IsString());
    FieldDeclaration.declare(Clash, "b", String, IsString(), Rename("a"));

    expect(() => Schema.safeParse(Clash, {})).toThrow(SchemaDefinitionError);
  });
});

describe("SCH-054 Transform", () => {
  it("transforms the value before it is validated", () => {
    class Search {
      public tags!: string;
    }
    FieldDeclaration.declare(
      Search,
      "tags",
      String,
      IsString({ max: 3 }),
      Transform((value) => (Array.isArray(value) ? value.join(",") : value)),
    );

    expect(Schema.parse(Search, { tags: ["a", "b"] }).tags).toBe("a,b");
    expect(Schema.safeParse(Search, { tags: ["abc", "d"] })).toMatchObject({
      issues: [{ code: "too_big" }],
    });
    expect(Schema.parse(Search, { tags: "x" }).tags).toBe("x");
  });

  it("is skipped for a missing value without Default and applied to a default", () => {
    const seen: unknown[] = [];
    class Search {
      public term?: string;
      public mode!: string;
    }
    const record = Transform((value) => {
      seen.push(value);
      return value;
    });
    FieldDeclaration.declare(Search, "term", String, IsString(), Optional(), record);
    FieldDeclaration.declare(Search, "mode", String, IsString(), Default("all"), record);

    Schema.parse(Search, {});

    expect(seen).toEqual(["all"]);
  });

  it("turns a throwing transform into a transform_failed issue", () => {
    class Search {
      public a!: string;
      public b!: string;
    }
    FieldDeclaration.declare(
      Search,
      "a",
      String,
      IsString(),
      Transform(() => {
        throw new Error("boom");
      }),
    );
    FieldDeclaration.declare(
      Search,
      "b",
      String,
      IsString({ message: "custom" }),
      Transform(() => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "plain";
      }),
    );

    expect(Schema.safeParse(Search, { a: "x", b: "y" })).toEqual({
      ok: false,
      issues: [
        {
          path: ["a"],
          code: "transform_failed",
          message: "Transform failed",
          params: { reason: "boom" },
        },
        {
          path: ["b"],
          code: "transform_failed",
          message: "custom",
          params: { reason: "plain" },
        },
      ],
    });
  });

  it("may turn a value into undefined so Optional leaves the key absent", () => {
    class Search {
      public term?: string;
    }
    FieldDeclaration.declare(
      Search,
      "term",
      String,
      IsString(),
      Optional(),
      Transform((value) => (value === "" ? undefined : value)),
    );

    expect(Object.keys(Schema.parse(Search, { term: "" }))).toEqual([]);
  });
});

describe("SCH-055 Modifier declarations", () => {
  it.each([
    ["Optional", Optional],
    ["Nullable", Nullable],
    ["Default", () => Default(1)],
    ["Rename", () => Rename("x")],
    ["Transform", () => Transform((value) => value)],
  ])("rejects a second %s on the same property", (_name, create) => {
    class Twice {
      public value!: string;
    }
    FieldDeclaration.declare(Twice, "value", String, IsString(), create());

    expect(() => FieldDeclaration.declare(Twice, "value", String, create())).toThrow(
      SchemaDefinitionError,
    );
  });

  it("rejects a property that only has modifiers on first parse", () => {
    class Orphan {
      public value!: string;
    }
    FieldDeclaration.declare(Orphan, "value", String, Optional());

    expect(() => Schema.safeParse(Orphan, {})).toThrow(SchemaDefinitionError);
  });

  it("rejects modifiers after the first parse, static and symbol members", () => {
    class Frozen {
      public value!: string;
    }
    FieldDeclaration.declare(Frozen, "value", String, IsString());
    Schema.safeParse(Frozen, { value: "x" });

    expect(() => Optional()(Frozen.prototype, "value")).toThrow(SchemaDefinitionError);
    expect(() => Optional()(Frozen, "value")).toThrow(SchemaDefinitionError);
    expect(() => Optional()(Frozen.prototype, Symbol("s"))).toThrow(SchemaDefinitionError);
  });
});

describe("SCH-056 Modifiers across inheritance", () => {
  it("lets a subclass add modifiers to an inherited field", () => {
    class Base {
      public name!: string;
    }
    class Derived extends Base {}
    FieldDeclaration.declare(Base, "name", String, IsString({ min: 2 }));
    FieldDeclaration.declare(Derived, "name", String, Optional(), Default("anon"));

    expect(Schema.parse(Derived, {}).name).toBe("anon");
    expect(Schema.safeParse(Derived, { name: "x" })).toMatchObject({
      issues: [{ code: "too_small" }],
    });
    expect(Schema.safeParse(Base, {})).toMatchObject({ ok: false });
  });

  it("lets a subclass type declaration replace the inherited modifiers", () => {
    class Base {
      public name!: string;
    }
    class Derived extends Base {}
    FieldDeclaration.declare(Base, "name", String, IsString(), Optional());
    FieldDeclaration.declare(Derived, "name", String, IsString());

    expect(Schema.safeParse(Derived, {})).toMatchObject({ ok: false });
    expect(Schema.parse(Base, {})).toEqual({});
  });
});
