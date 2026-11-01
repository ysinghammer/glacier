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
  Schema,
} from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

describe("SCH-100 Property-level Refine", () => {
  /** Account fixture with one field guarded by a custom string predicate. */
  class Account {
    /** String accepted only when its character count is even. */
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
    expect(Schema.parse(Account, { even: "ab" }).even).toBe("ab");
    expect(Schema.safeParse(Account, { even: "abc" })).toEqual({
      ok: false,
      issues: [{ path: ["even"], code: "custom", message: "must be even", params: {} }],
    });
  });

  it("is skipped when type validation failed and for absent or null values", () => {
    let calls = 0;
    /** Probe fixture used to check when field refinements are skipped. */
    class Probe {
      /** Optional field absent during the scenario. */
      public a?: string;
      /** Nullable field supplied as null during the scenario. */
      public b!: string | null;
      /** Required field supplied with an invalid primitive type. */
      public c!: string;
    }
    /**
     * Creates a predicate that records whether field refinement ran.
     * @returns Property decorator with a counting refinement predicate.
     */
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

    const result = Schema.safeParse(Probe, { b: null, c: 5 });

    expect(result).toMatchObject({ ok: false, issues: [{ path: ["c"], code: "invalid_type" }] });
    expect(calls).toBe(0);
  });

  it("sees the transformed value, uses a default message and uses the Rename alias in the path", () => {
    /** Tag fixture whose normalized label is checked by a refinement. */
    class Tag {
      /** Label read from the `tag` input key and trimmed before refinement. */
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

    expect(Schema.parse(Tag, { tag: "  x " }).label).toBe("x");
    expect(Schema.safeParse(Tag, { tag: "   " })).toMatchObject({
      ok: false,
      issues: [{ path: ["tag"], code: "custom", message: "Refinement failed" }],
    });
  });

  it("reports an exception from the predicate with its reason", () => {
    /** Fixture whose field predicate throws during validation. */
    class Boom {
      /** String value passed to the throwing predicate. */
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

    expect(Schema.safeParse(Boom, { v: "x" })).toMatchObject({
      ok: false,
      issues: [{ path: ["v"], code: "custom", params: { reason: "nope" } }],
    });
  });

  it("reports a non-Error throw as the reason and skips an undefined accepted value", () => {
    /** Fixture for non-Error predicate throws and absent arbitrary values. */
    class Odd {
      /** String field with a predicate that throws a primitive value. */
      public v!: string;
      /** Optional arbitrary field whose refinement is skipped when absent. */
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

    expect(Schema.safeParse(Odd, { v: "x" })).toMatchObject({
      ok: false,
      issues: [{ path: ["v"], params: { reason: "plain" } }],
    });
  });

  it("works inside collections of nested classes with full paths", () => {
    /** Collection element fixture with a rejecting quantity refinement. */
    class Item {
      /** Quantity field whose refinement produces a nested issue. */
      public qty!: string;
    }
    FieldDeclaration.declare(
      Item,
      "qty",
      String,
      IsString(),
      Refine(() => false, "bad"),
    );
    /** Order fixture containing a list of refined items. */
    class Order {
      /** Items parsed recursively with their refinement rules. */
      public items!: Item[];
    }
    FieldDeclaration.declare(Order, "items", Array, IsArray(Item));

    expect(Schema.safeParse(Order, { items: [{ qty: "1" }] })).toMatchObject({
      ok: false,
      issues: [{ path: ["items", 0, "qty"], code: "custom", message: "bad" }],
    });
  });

  it("is rejected twice on one property and after the schema is frozen", () => {
    /** Fixture used to reject duplicate field refinements. */
    class Twice {
      /** Field receiving two refinement declarations. */
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

    /** Fixture whose field metadata is frozen by its first parse. */
    class Late {
      /** Field used to check refinement rejection after compilation. */
      public v!: string;
    }
    FieldDeclaration.declare(Late, "v", String, IsString());
    Schema.parse(Late, { v: "x" });
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
  /** Signup fixture whose password and confirmation must agree. */
  class Signup {
    /** Password value compared by the class refinement. */
    public password!: string;
    /** Confirmation value receiving the mismatch issue path. */
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
    expect(Schema.parse(Signup, { password: "a", confirm: "a" }).confirm).toBe("a");
    expect(Schema.safeParse(Signup, { password: "a", confirm: "b" })).toEqual({
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
    /** Date range fixture whose start must not follow its end. */
    class Range {
      /** Beginning of the range checked by the class predicate. */
      public from!: Date;
      /** End of the range checked by the class predicate. */
      public to!: Date;
    }
    FieldDeclaration.declare(Range, "from", Date, IsDate());
    FieldDeclaration.declare(Range, "to", Date, IsDate());
    Refine<Range>((value) => value.from <= value.to, {})(Range);

    expect(Schema.safeParse(Range, { from: new Date(2), to: new Date(1) })).toEqual({
      ok: false,
      issues: [{ path: [], code: "custom", message: "Refinement failed", params: {} }],
    });
    expect(Schema.safeParse(Range, { from: new Date(1), to: new Date(2) }).ok).toBe(true);
  });

  it("is skipped when any field failed and reports every failing refinement otherwise", () => {
    let calls = 0;
    /** Pair fixture with multiple class-level refinements. */
    class Pair {
      /** Validated field used to gate class-level checks. */
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

    expect(Schema.safeParse(Pair, { a: 1 })).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_type" }],
    });
    expect(calls).toBe(0);
    const result = Schema.safeParse(Pair, { a: "x" });
    expect(result).toMatchObject({ ok: false });
    expect(result.ok ? [] : result.issues.map((issue) => issue.code)).toEqual(["first", "second"]);
  });

  it("reports exceptions of the check as issues with the reason", () => {
    /** Fixture whose class refinements throw different value types. */
    class Fragile {
      /** Validated field required before class predicates execute. */
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

    expect(Schema.safeParse(Fragile, { a: "x" })).toMatchObject({
      ok: false,
      issues: [
        { code: "e", params: { reason: "broken" } },
        { code: "custom", params: { reason: "plain" } },
      ],
    });
  });

  it("runs nested refinements with prefixed paths and not when the nested value is invalid", () => {
    /** Outer fixture combining a refined nested signup and a local tag. */
    class Outer {
      /** Signup value parsed with its own cross-field rule. */
      public inner!: Signup;
      /** Outer field whose failing rule is skipped when the child is invalid. */
      public tag!: string;
    }
    FieldDeclaration.declare(Outer, "inner", Object, IsObject(Signup));
    FieldDeclaration.declare(Outer, "tag", String, IsString());
    Refine<Outer>((value) => value.tag !== "x", { path: ["tag"] })(Outer);

    expect(
      Schema.safeParse(Outer, { inner: { password: "a", confirm: "b" }, tag: "x" }),
    ).toMatchObject({
      ok: false,
      issues: [{ path: ["inner", "confirm"], code: "password_mismatch" }],
    });
  });

  it("is inherited by subclasses and rejects late decoration and failing decorator setup", () => {
    /** Admin fixture inheriting signup's class-level password rule. */
    class Admin extends Signup {
      /** Added field validated alongside inherited signup values. */
      public level!: string;
    }
    FieldDeclaration.declare(Admin, "level", String, IsString());

    expect(Schema.safeParse(Admin, { password: "a", confirm: "b", level: "1" })).toMatchObject({
      ok: false,
      issues: [{ code: "password_mismatch" }],
    });
    expect(() => Refine<Signup>(() => true, {})(Signup)).toThrow(SchemaDefinitionError);
  });
});

describe("SCH-102 Refine with Rename and options", () => {
  it("passes coercion through and runs on the coerced instance", () => {
    /** Window fixture whose date ordering is checked after coercion. */
    class Window {
      /** Start date parsed from the `from` input key. */
      public from!: Date;
      /** End date parsed from the aliased `end` input key. */
      public until!: Date;
    }
    FieldDeclaration.declare(Window, "from", Date, IsDate());
    FieldDeclaration.declare(Window, "until", Date, IsDate(), Rename("end"));
    Refine<Window>((value) => value.from < value.until, { path: ["end"] })(Window);

    expect(
      Schema.safeParse(Window, { from: "2024-02-01", end: "2024-01-01" }, { coerce: true }),
    ).toMatchObject({ ok: false, issues: [{ path: ["end"], code: "custom" }] });
  });
});

describe("SCH-103 Refine on subclass fields", () => {
  it("applies a property refinement added by a subclass to an inherited field", () => {
    /** Base fixture declaring an unrestricted string name. */
    class Base {
      /** Name inherited and further constrained by `Strict`. */
      public name!: string;
    }
    FieldDeclaration.declare(Base, "name", String, IsString());
    /** Subclass restricting the inherited name to non-reserved values. */
    class Strict extends Base {}
    FieldDeclaration.declare(
      Strict,
      "name",
      undefined,
      Refine((value) => value !== "admin", "reserved"),
    );

    expect(Schema.parse(Base, { name: "admin" }).name).toBe("admin");
    expect(Schema.safeParse(Strict, { name: "admin" })).toMatchObject({
      ok: false,
      issues: [{ path: ["name"], message: "reserved" }],
    });
  });
});
