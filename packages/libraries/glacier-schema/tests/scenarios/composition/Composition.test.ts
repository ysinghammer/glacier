// @scenario SCH-110
// @scenario SCH-111
// @scenario SCH-112
// @scenario SCH-113
// @scenario SCH-114
// @scenario SCH-115
import { describe, expect, it } from "vitest";
import {
  ExtendType,
  IsInt,
  IsString,
  IsUnion,
  Nullable,
  OmitType,
  Optional,
  PartialType,
  PickType,
  Default,
  Refine,
  Rename,
  SchemaDefinitionError,
  Schema,
} from "../../../index.js";
import { DerivedClasses } from "../../../src/domain/schemaProcessing/schema/DerivedClasses.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

/**
 * Creates a fresh user schema fixture for derived-class scenarios.
 * @returns Constructor with required identity/contact fields and optional age.
 */
function createUserClass(): new () => { name: string; email: string; age?: number; role: string } {
  /** Source fixture carrying the constraints inherited by derived schemas. */
  class CreateUser {
    /** User display name with a minimum-length constraint. */
    public name!: string;
    /** User email read from the `mail` input alias. */
    public email!: string;
    /** Optional non-negative user age. */
    public age?: number;
    /**
     * User role defaulted when omitted.
     * @default "member"
     */
    public role!: string;
  }
  FieldDeclaration.declare(CreateUser, "name", String, IsString({ min: 2 }));
  FieldDeclaration.declare(
    CreateUser,
    "email",
    String,
    IsString({ format: "email" }),
    Rename("mail"),
  );
  FieldDeclaration.declare(CreateUser, "age", Number, IsInt({ min: 0 }), Optional());
  FieldDeclaration.declare(CreateUser, "role", String, IsString(), Default("member"));
  return CreateUser;
}

describe("SCH-110 Inheritance of decorators", () => {
  /** Base schema supplying inherited identifier and label constraints. */
  class Base {
    /** Identifier requiring at least three characters. */
    public id!: string;
    /** Required label inherited by child classes. */
    public label!: string;
  }
  FieldDeclaration.declare(Base, "id", String, IsString({ min: 3 }));
  FieldDeclaration.declare(Base, "label", String, IsString());
  /** Child schema overriding the inherited label and adding two fields. */
  class Child extends Base {
    /** Integer count introduced by this subclass. */
    public count!: number;
    /** Optional tag introduced by this subclass. */
    public tag?: string;
  }
  FieldDeclaration.declare(Child, "label", String, IsString({ max: 2 }), Optional());
  FieldDeclaration.declare(Child, "count", Number, IsInt());
  /** Grandchild schema tightening the inherited count constraint. */
  class Grandchild extends Child {}
  FieldDeclaration.declare(Grandchild, "count", Number, IsInt({ min: 10 }));

  it("inherits fields, lets a subclass declaration replace them and keeps nested levels", () => {
    expect(Schema.safeParse(Child, { id: "abc", count: 1 }).ok).toBe(true);
    expect(Schema.safeParse(Child, { id: "abcd", label: "xyz", count: 1 }).ok).toBe(false);
    expect(Schema.parse(Grandchild, { id: "abc", count: 11 })).toBeInstanceOf(Grandchild);
    expect(Schema.safeParse(Grandchild, { id: "ab", count: 5 })).toMatchObject({
      ok: false,
      issues: [{ path: ["id"] }, { path: ["count"] }],
    });
  });
});

describe("SCH-111 PartialType", () => {
  it("makes every field optional, drops defaults and keeps validation of present values", () => {
    const UpdateUser = PartialType(createUserClass());

    expect(Schema.parse(UpdateUser, {})).toEqual({});
    expect(Schema.parse(UpdateUser, { name: "Ada", mail: "ada@example.com" })).toEqual({
      name: "Ada",
      email: "ada@example.com",
    });
    expect(Schema.safeParse(UpdateUser, { name: "A", age: -1 })).toMatchObject({
      ok: false,
      issues: [{ path: ["name"] }, { path: ["age"] }],
    });
  });

  it("keeps nullable and property refinements and drops class refinements", () => {
    /** Source fixture whose field rules survive partial derivation. */
    class Source {
      /** Nullable note retaining its property validation. */
      public note!: string | null;
      /** Code field guarded by a property-level refinement. */
      public code!: string;
    }
    FieldDeclaration.declare(Source, "note", String, IsString(), Nullable());
    FieldDeclaration.declare(
      Source,
      "code",
      String,
      IsString(),
      Refine((value) => value === "ok", "bad"),
    );
    Refine<Source>(() => false, { message: "never" })(Source);
    const Update = PartialType(Source);

    expect(Schema.parse(Update, { note: null })).toEqual({ note: null });
    expect(Schema.safeParse(Update, { code: "no" }).ok).toBe(false);
    expect(Schema.safeParse(Update, { code: "ok" }).ok).toBe(true);
  });

  it("can be extended with further decorated fields", () => {
    /** Partial user fixture extended by a newly required field. */
    class Update extends PartialType(createUserClass()) {
      /** Additional value required by the derived update schema. */
      public extra!: string;
    }
    FieldDeclaration.declare(Update, "extra", String, IsString());

    expect(Schema.parse(Update, { extra: "x" })).toEqual({ extra: "x" });
    expect(Schema.safeParse(Update, {}).ok).toBe(false);
  });
});

describe("SCH-112 PickType and OmitType", () => {
  it("pick keeps only the listed fields with their modifiers", () => {
    const Login = PickType(createUserClass(), ["email", "role"]);

    expect(Schema.parse(Login, { mail: "a@b.co", name: "ignored" })).toEqual({
      email: "a@b.co",
      role: "member",
    });
    expect(Schema.safeParse(Login, { mail: "nope" }).ok).toBe(false);
  });

  it("omit removes the listed fields", () => {
    const Profile = OmitType(createUserClass(), ["email", "role"]);

    expect(Schema.parse(Profile, { name: "Ada", mail: "x" })).toEqual({ name: "Ada" });
  });

  it("rejects keys that are not schema fields and drops class refinements", () => {
    /** Source with a class refinement removed by derived schemas. */
    class Source {
      /** First required source field. */
      public a!: string;
      /** Second required source field compared by the class rule. */
      public b!: string;
    }
    FieldDeclaration.declare(Source, "a", String, IsString());
    FieldDeclaration.declare(Source, "b", String, IsString());
    Refine<Source>((value) => value.a === value.b, { message: "differ" })(Source);

    expect(() => PickType(Source, ["zzz" as "a"])).toThrow(SchemaDefinitionError);
    expect(() => OmitType(Source, ["zzz" as "a"])).toThrow("Cannot omit zzz: Source has no such");
    expect(Schema.safeParse(OmitType(Source, ["b"]), { a: "1" }).ok).toBe(true);
    expect(Schema.safeParse(Source, { a: "1", b: "2" }).ok).toBe(false);
  });
});

describe("SCH-113 ExtendType", () => {
  it("adds extension fields and lets them replace base fields, keeping both refinements", () => {
    /** Base fixture retaining secret validation and a class refinement. */
    class Base {
      /** Name replaced by the extension's less restrictive declaration. */
      public name!: string;
      /** Secret field retained from the base schema. */
      public secret!: string;
    }
    FieldDeclaration.declare(Base, "name", String, IsString({ min: 5 }));
    FieldDeclaration.declare(Base, "secret", String, IsString());
    Refine<Base>((value) => value.secret !== "bad", { message: "base" })(Base);
    /** Extension fixture replacing `name` and adding an integer field. */
    class Extension {
      /** Replacement name with the extension's own constraint. */
      public name!: string;
      /** Additional integer used by the extension class refinement. */
      public extra!: number;
    }
    FieldDeclaration.declare(Extension, "name", String, IsString({ min: 1 }));
    FieldDeclaration.declare(Extension, "extra", Number, IsInt());
    Refine<Extension>((value) => value.extra !== 13, { message: "extension" })(Extension);
    const Combined = ExtendType(Base, Extension);

    expect(Schema.parse(Combined, { name: "a", secret: "s", extra: 1 })).toEqual({
      name: "a",
      secret: "s",
      extra: 1,
    });
    expect(Schema.safeParse(Combined, { name: "a", secret: "bad", extra: 1 }).ok).toBe(false);
    expect(Schema.safeParse(Combined, { name: "a", secret: "s", extra: 13 }).ok).toBe(false);
    expect(Schema.safeParse(Combined, { secret: "s", extra: 1 }).ok).toBe(false);
  });

  it("supports nested derivation chains", () => {
    const Create = createUserClass();
    const Update = PartialType(OmitType(Create, ["role"]));
    /** Audit patch contributing a required reason field. */
    class Patch {
      /** Reason retained alongside derived user fields. */
      public reason!: string;
    }
    FieldDeclaration.declare(Patch, "reason", String, IsString());
    const AuditedUpdate = ExtendType(Update, Patch);

    expect(Schema.parse(AuditedUpdate, { reason: "fix", name: "Ada" })).toEqual({
      reason: "fix",
      name: "Ada",
    });
    expect(Schema.safeParse(AuditedUpdate, { name: "Ada" }).ok).toBe(false);
  });
});

describe("SCH-114 Derived classes and frozen sources", () => {
  it("freezes the source and rejects unions and unnamed misuse", () => {
    const Create = createUserClass();
    PickType(Create, ["name"]);

    expect(() => FieldDeclaration.declare(Create, "late", undefined, IsString())).toThrow("frozen");

    /** Variant used to verify derivation rejects union roots. */
    class Cat {}
    /** Union root that cannot be passed to derivation operations. */
    class Union {}
    IsUnion({ discriminator: "type", variants: { cat: Cat } })(Union);
    expect(() => PartialType(Union)).toThrow("it is a union");
  });

  it("freezes a derived class when it is parsed", () => {
    const Derived = PickType(createUserClass(), ["name"]);
    Schema.parse(Derived, { name: "Ada" });

    expect(() => FieldDeclaration.declare(Derived, "late", undefined, IsString())).toThrow(
      "frozen",
    );
  });

  it("produces plain instances of the derived class", () => {
    const Derived = PickType(createUserClass(), ["name"]);

    expect(Schema.parse(Derived, { name: "Ada" })).toBeInstanceOf(Derived);
  });
});

describe("SCH-115 Derived class metadata", () => {
  it("names derived classes and records their origin", () => {
    const Create = createUserClass();
    /** Empty source whose field is declared dynamically for metadata checks. */
    class Source {}
    FieldDeclaration.declare(Source, "a", String, IsString());
    /** Independent empty source used as an extension class. */
    class Other {}
    FieldDeclaration.declare(Other, "b", String, IsString());

    const partial = PartialType(Source);
    const picked = PickType(Source, ["a" as never], { name: "Picked" });
    const omitted = OmitType(Source, []);
    const extended = ExtendType(Source, Other);

    expect([partial, picked, omitted, extended].map((derived) => derived.name)).toEqual([
      "PartialSource",
      "Picked",
      "OmitSource",
      "ExtendSource",
    ]);
    expect(DerivedClasses.describe(partial)).toEqual({ kind: "partial", source: Source });
    expect(DerivedClasses.describe(picked)).toEqual({ kind: "pick", source: Source });
    expect(DerivedClasses.describe(omitted)).toEqual({ kind: "omit", source: Source });
    expect(DerivedClasses.describe(extended)).toEqual({
      kind: "extend",
      source: Source,
      extension: Other,
    });
    expect(DerivedClasses.describe(Create)).toBeUndefined();
    /** Ordinary subclass that does not inherit derived-origin metadata. */
    class Sub extends partial {}
    expect(DerivedClasses.describe(Sub)).toBeUndefined();
  });
});
