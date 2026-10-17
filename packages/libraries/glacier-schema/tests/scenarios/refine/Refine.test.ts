// @scenario SCH-100
// @scenario SCH-101
// @scenario SCH-102
// @scenario SCH-103
import { describe, expect, it } from "vitest";
import {
  IsAny,
  IsArray,
  IsDate,
  IsObject,
  IsString,
  Nullable,
  Optional,
  Refine,
  Rename,
  SchemaDefinitionError,
  Transform,
  parse,
  safeParse,
} from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

describe("SCH-100 Property-level Refine", () => {
  class Account {
    public even!: string;
  }
  FieldDeclaration.declare(
    Account,
    "even",
    String,
    IsString(),
    Refine((value) => typeof value === "string" && value.length % 2 === 0, "must be even"),
  );

  it("accepts values the predicate approves and reports a custom issue otherwise", () => {
    expect(parse(Account, { even: "ab" }).even).toBe("ab");
    expect(safeParse(Account, { even: "abc" })).toEqual({
      ok: false,
      issues: [{ path: ["even"], code: "custom", message: "must be even", params: {} }],
    });
  });

  it("is skipped when type validation failed and for absent or null values", () => {
    let calls = 0;
    class Probe {
      public a?: string;
      public b!: string | null;
      public c!: string;
    }
    const probe = (): PropertyDecorator =>
      Refine(() => {
        calls += 1;
        return true;
      });
    FieldDeclaration.declare(Probe, "a", String, IsString(), Optional(), probe());
    FieldDeclaration.declare(Probe, "b", String, IsString(), Nullable(), probe());
    FieldDeclaration.declare(
      Probe,
      "c",
      String,
      IsString(),
      Refine(() => false),
    );

    const result = safeParse(Probe, { b: null, c: 5 });

    expect(result).toMatchObject({ ok: false, issues: [{ path: ["c"], code: "invalid_type" }] });
    expect(calls).toBe(0);
  });

  it("sees the transformed value, uses a default message and uses the Rename alias in the path", () => {
    class Tag {
      public label!: string;
    }
    FieldDeclaration.declare(
      Tag,
      "label",
      String,
      IsString(),
      Rename("tag"),
      Transform((value) => String(value).trim()),
      Refine((value) => value !== ""),
    );

    expect(parse(Tag, { tag: "  x " }).label).toBe("x");
    expect(safeParse(Tag, { tag: "   " })).toMatchObject({
      ok: false,
      issues: [{ path: ["tag"], code: "custom", message: "Refinement failed" }],
    });
  });

  it("reports an exception from the predicate with its reason", () => {
    class Boom {
      public v!: string;
    }
    FieldDeclaration.declare(
      Boom,
      "v",
      String,
      IsString(),
      Refine(() => {
        throw new Error("nope");
      }),
    );

    expect(safeParse(Boom, { v: "x" })).toMatchObject({
      ok: false,
      issues: [{ path: ["v"], code: "custom", params: { reason: "nope" } }],
    });
  });

  it("reports a non-Error throw as the reason and skips an undefined accepted value", () => {
    class Odd {
      public v!: string;
      public any?: unknown;
    }
    FieldDeclaration.declare(
      Odd,
      "v",
      String,
      IsString(),
      Refine(() => {
        throw "plain";
      }),
    );
    FieldDeclaration.declare(
      Odd,
      "any",
      undefined,
      IsAny(),
      Refine(() => false),
    );

    expect(safeParse(Odd, { v: "x" })).toMatchObject({
      ok: false,
      issues: [{ path: ["v"], params: { reason: "plain" } }],
    });
  });

  it("works inside collections of nested classes with full paths", () => {
    class Item {
      public qty!: string;
    }
    FieldDeclaration.declare(
      Item,
      "qty",
      String,
      IsString(),
      Refine(() => false, "bad"),
    );
    class Order {
      public items!: Item[];
    }
    FieldDeclaration.declare(Order, "items", Array, IsArray(Item));

    expect(safeParse(Order, { items: [{ qty: "1" }] })).toMatchObject({
      ok: false,
      issues: [{ path: ["items", 0, "qty"], code: "custom", message: "bad" }],
    });
  });

  it("is rejected twice on one property and after the schema is frozen", () => {
    class Twice {
      public v!: string;
    }
    expect(() =>
      FieldDeclaration.declare(
        Twice,
        "v",
        String,
        IsString(),
        Refine(() => true),
        Refine(() => true),
      ),
    ).toThrow(SchemaDefinitionError);

    class Late {
      public v!: string;
    }
    FieldDeclaration.declare(Late, "v", String, IsString());
    parse(Late, { v: "x" });
    expect(() =>
      FieldDeclaration.declare(
        Late,
        "v",
        String,
        Refine(() => true),
      ),
    ).toThrow(SchemaDefinitionError);
  });
});

describe("SCH-101 Class-level Refine", () => {
  class Signup {
    public password!: string;
    public confirm!: string;
  }
  FieldDeclaration.declare(Signup, "password", String, IsString());
  FieldDeclaration.declare(Signup, "confirm", String, IsString());
  Refine<Signup>((value) => value.password === value.confirm, {
    path: ["confirm"],
    code: "password_mismatch",
    message: "Passwords differ",
  })(Signup);

  it("validates cross-field rules with a custom path, code and message", () => {
    expect(parse(Signup, { password: "a", confirm: "a" }).confirm).toBe("a");
    expect(safeParse(Signup, { password: "a", confirm: "b" })).toEqual({
      ok: false,
      issues: [
        {
          path: ["confirm"],
          code: "password_mismatch",
          message: "Passwords differ",
          params: {},
        },
      ],
    });
  });

  it("validates a date range and defaults to the root path and the custom code", () => {
    class Range {
      public from!: Date;
      public to!: Date;
    }
    FieldDeclaration.declare(Range, "from", Date, IsDate());
    FieldDeclaration.declare(Range, "to", Date, IsDate());
    Refine<Range>((value) => value.from <= value.to, {})(Range);

    expect(safeParse(Range, { from: new Date(2), to: new Date(1) })).toEqual({
      ok: false,
      issues: [{ path: [], code: "custom", message: "Refinement failed", params: {} }],
    });
    expect(safeParse(Range, { from: new Date(1), to: new Date(2) }).ok).toBe(true);
  });

  it("is skipped when any field failed and reports every failing refinement otherwise", () => {
    let calls = 0;
    class Pair {
      public a!: string;
    }
    FieldDeclaration.declare(Pair, "a", String, IsString());
    Refine<Pair>(
      () => {
        calls += 1;
        return false;
      },
      { code: "first" },
    )(Pair);
    Refine<Pair>(() => false, { code: "second", path: ["a"] })(Pair);

    expect(safeParse(Pair, { a: 1 })).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_type" }],
    });
    expect(calls).toBe(0);
    const result = safeParse(Pair, { a: "x" });
    expect(result).toMatchObject({ ok: false });
    expect(result.ok ? [] : result.issues.map((issue) => issue.code)).toEqual(["first", "second"]);
  });

  it("reports exceptions of the check as issues with the reason", () => {
    class Fragile {
      public a!: string;
    }
    FieldDeclaration.declare(Fragile, "a", String, IsString());
    Refine<Fragile>(
      () => {
        throw new Error("broken");
      },
      { code: "e" },
    )(Fragile);
    Refine<Fragile>(() => {
      throw "plain";
    }, {})(Fragile);

    expect(safeParse(Fragile, { a: "x" })).toMatchObject({
      ok: false,
      issues: [
        { code: "e", params: { reason: "broken" } },
        { code: "custom", params: { reason: "plain" } },
      ],
    });
  });

  it("runs nested refinements with prefixed paths and not when the nested value is invalid", () => {
    class Outer {
      public inner!: Signup;
      public tag!: string;
    }
    FieldDeclaration.declare(Outer, "inner", Object, IsObject(Signup));
    FieldDeclaration.declare(Outer, "tag", String, IsString());
    Refine<Outer>((value) => value.tag !== "x", { path: ["tag"] })(Outer);

    expect(safeParse(Outer, { inner: { password: "a", confirm: "b" }, tag: "x" })).toMatchObject({
      ok: false,
      issues: [{ path: ["inner", "confirm"], code: "password_mismatch" }],
    });
  });

  it("is inherited by subclasses and rejects late decoration and failing decorator setup", () => {
    class Admin extends Signup {
      public level!: string;
    }
    FieldDeclaration.declare(Admin, "level", String, IsString());

    expect(safeParse(Admin, { password: "a", confirm: "b", level: "1" })).toMatchObject({
      ok: false,
      issues: [{ code: "password_mismatch" }],
    });
    expect(() => Refine<Signup>(() => true, {})(Signup)).toThrow(SchemaDefinitionError);
  });
});

describe("SCH-102 Refine with Rename and options", () => {
  it("passes coercion through and runs on the coerced instance", () => {
    class Window {
      public from!: Date;
      public until!: Date;
    }
    FieldDeclaration.declare(Window, "from", Date, IsDate());
    FieldDeclaration.declare(Window, "until", Date, IsDate(), Rename("end"));
    Refine<Window>((value) => value.from < value.until, { path: ["end"] })(Window);

    expect(
      safeParse(Window, { from: "2024-02-01", end: "2024-01-01" }, { coerce: true }),
    ).toMatchObject({ ok: false, issues: [{ path: ["end"], code: "custom" }] });
  });
});

describe("SCH-103 Refine on subclass fields", () => {
  it("applies a property refinement added by a subclass to an inherited field", () => {
    class Base {
      public name!: string;
    }
    FieldDeclaration.declare(Base, "name", String, IsString());
    class Strict extends Base {}
    FieldDeclaration.declare(
      Strict,
      "name",
      undefined,
      Refine((value) => value !== "admin", "reserved"),
    );

    expect(parse(Base, { name: "admin" }).name).toBe("admin");
    expect(safeParse(Strict, { name: "admin" })).toMatchObject({
      ok: false,
      issues: [{ path: ["name"], message: "reserved" }],
    });
  });
});
