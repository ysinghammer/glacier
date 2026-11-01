import { describe, expect, it } from "vitest";
import {
  Default,
  IsAny,
  IsArray,
  IsBigInt,
  IsDate,
  IsInt,
  IsLiteral,
  IsObject,
  IsString,
  IsUnion,
  Nullable,
  Optional,
  Refine,
  Rename,
  Transform,
} from "@glacier/schema";
import { Sql, SqlFragment, TableMapping } from "@glacier/orm";

/** Nested native object using an independent logical and wire field name. */
class Profile {
  /** Logical name normalized before binding. */
  public displayName!: string;
  /** Native bigint preserved during nested validation. */
  public count!: bigint;
}
IsString({ trim: true })(Profile.prototype, "displayName");
Rename("display_wire")(Profile.prototype, "displayName");
IsBigInt()(Profile.prototype, "count");
Refine<Profile>((value) => value.count > 0n, { message: "count must be positive" })(Profile);

/** Table fixture combining schema defaults, database defaults and independent names. */
class User {
  /** Generated identifier with a schema default that must not force insertion. */
  public id?: string;
  /** Required name normalized before binding. */
  public name!: string;
  /** Database default with an unrelated schema default. */
  public role?: string;
  /** Schema-owned default included when omitted. */
  public level?: number;
  /** Arbitrary native parameter, including a SQL fragment as data. */
  public payload?: unknown;
  /** Nested schema with native values. */
  public profile?: Profile;
  /** Optional value whose transform can remove supplied input. */
  public vanish?: string;
}
TableMapping.table("users")(User);
IsString()(User.prototype, "id");
Optional()(User.prototype, "id");
Default("schema-id")(User.prototype, "id");
TableMapping.generated()(User.prototype, "id");
IsString({ min: 2, trim: true })(User.prototype, "name");
Rename("wire_name")(User.prototype, "name");
TableMapping.column('name"column')(User.prototype, "name");
IsString()(User.prototype, "role");
Optional()(User.prototype, "role");
Default("schema-role")(User.prototype, "role");
TableMapping.dbDefault()(User.prototype, "role");
IsInt({ min: 0 })(User.prototype, "level");
Optional()(User.prototype, "level");
Default(7)(User.prototype, "level");
IsAny()(User.prototype, "payload");
Optional()(User.prototype, "payload");
IsObject(Profile)(User.prototype, "profile");
Optional()(User.prototype, "profile");
IsString()(User.prototype, "vanish");
Optional()(User.prototype, "vanish");
Transform((value) => (value === "drop" ? undefined : value))(User.prototype, "vanish");
Refine<User>((value) => value.name !== "blocked", { message: "blocked name" })(User);

describe("SQL write helpers", () => {
  it("retains native date values, binds normalized arrays, and accepts nullable fields", () => {
    /** Table with native collection and nullable scalar fields. */
    class Native {
      /** Date passed directly to PostgreSQL. */
      public date!: Date;
      /** PostgreSQL array whose values are validated. */
      public tags!: string[];
      /** Explicit SQL null is a permitted value. */
      public note!: string | null;
    }
    TableMapping.table("native")(Native);
    IsDate()(Native.prototype, "date");
    IsArray(String)(Native.prototype, "tags");
    IsString()(Native.prototype, "note");
    Nullable()(Native.prototype, "note");
    const date = new Date("2024-01-02T00:00:00Z");
    const tags = ["a", "b"];
    const result = Sql.values(Native, { date, tags, note: null });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected success");
    const compiled = result.value.compile();
    expect(compiled.text).toBe('("date", "tags", "note") values ($1, $2, $3)');
    expect(compiled.values).toEqual([date, tags, null]);
    expect(compiled.values[0]).toBe(date);
    expect(compiled.values[1]).not.toBe(tags);
    expect(Sql.set(Native, { note: null })).toMatchObject({ ok: true });
  });

  it("preserves reserved property names while escaping hostile database identifiers", () => {
    /** Schema whose field resembles a prototype property. */
    class Reserved {}
    TableMapping.table("reserved")(Reserved);
    IsString()(Reserved.prototype, "__proto__");
    TableMapping.column('x"; drop table t; --')(Reserved.prototype, "__proto__");
    const input = Object.defineProperty({}, "__proto__", { value: "safe", enumerable: false });
    const result = Sql.set(Reserved, input);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected success");
    expect(result.value.compile()).toEqual({
      text: '"x""; drop table t; --" = $1',
      values: ["safe"],
    });
  });

  it("rejects ambiguous nested union discriminators for inserts and updates", () => {
    /** Variant with a logical cat discriminator. */
    class Cat {
      /** Cat tag. */ public catKind!: "cat";
    }
    /** Variant with a different logical dog discriminator. */
    class Dog {
      /** Dog tag. */ public dogKind!: "dog";
    }
    IsLiteral("cat")(Cat.prototype, "catKind");
    Rename("type")(Cat.prototype, "catKind");
    IsLiteral("dog")(Dog.prototype, "dogKind");
    Rename("type")(Dog.prototype, "dogKind");
    /** Table with a nested discriminated union field. */
    class Pets {
      /** Selected animal. */ public pet!: Cat | Dog;
    }
    TableMapping.table("pets")(Pets);
    IsUnion({ discriminator: "type", variants: { cat: Cat, dog: Dog } })(Pets.prototype, "pet");
    const pet = { catKind: "cat" as const, dogKind: "dog" as const };
    expect(Sql.values(Pets, { pet })).toMatchObject({
      ok: false,
      issues: [{ path: ["pet"], code: "invalid_discriminator" }],
    });
    expect(Sql.set(Pets, { pet })).toMatchObject({
      ok: false,
      issues: [{ path: ["pet"], code: "invalid_discriminator" }],
    });
  });

  it("rejects undefined values introduced by a class refinement", () => {
    /** Table with a refinement that mutates its parsed instance. */
    class Mutated {
      /** Originally supplied name. */ public name!: string;
    }
    TableMapping.table("mutated")(Mutated);
    IsString()(Mutated.prototype, "name");
    Refine<Mutated>((value) => {
      Reflect.set(value, "name", undefined);
      return true;
    }, {})(Mutated);
    expect(Sql.values(Mutated, { name: "Ada" })).toMatchObject({
      ok: false,
      issues: [{ path: ["name"], params: { reason: "undefined_result" } }],
    });
  });
  it("inserts normalized rows with safe column names and database-owned omissions", () => {
    const result = Sql.values(User, { name: " Ada " });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected success");
    expect(result.value.compile()).toEqual({
      text: '("name""column", "level") values ($1, $2)',
      values: ["Ada", 7],
    });
    expect(
      Sql.tag`insert into ${Sql.ident("users")} ${result.value} returning ${123}`.compile(),
    ).toEqual({
      text: 'insert into "users" ("name""column", "level") values ($1, $2) returning $3',
      values: ["Ada", 7, 123],
    });
  });

  it("includes explicitly supplied database-owned fields and validates nested logical values", () => {
    const profile = { displayName: " Ada ", count: 3n };
    const result = Sql.values(User, { role: "guest", name: "Bob", id: "1", profile });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected success");
    const compiled = result.value.compile();
    expect(compiled.text).toBe(
      '("id", "name""column", "role", "level", "profile") values ($1, $2, $3, $4, $5)',
    );
    expect(compiled.values).toEqual(["1", "Bob", "guest", 7, { displayName: "Ada", count: 3n }]);
    expect(compiled.values[4]).not.toBe(profile);
  });

  it("binds SqlFragment values as data in writes and composes numbering safely", () => {
    const data = Sql.tag`dangerous = ${"value"}`;
    const inserted = Sql.values(User, { name: "Ada", payload: data });
    const updated = Sql.set(User, { payload: data });
    expect(inserted.ok && updated.ok).toBe(true);
    if (!inserted.ok || !updated.ok) throw new Error("expected success");
    const result = Sql.tag`${"before"} ${inserted.value} ${updated.value} ${"after"}`.compile();
    expect(result.text).toBe(
      '$1 ("name""column", "level", "payload") values ($2, $3, $4) "payload" = $5 $6',
    );
    expect(result.values).toEqual(["before", "Ada", 7, data, data, "after"]);
    expect(result.values[3]).toBe(data);
    expect(result.values[4]).toBe(data);
    expect(SqlFragment.parameter(data).compile()).toEqual({ text: "$1", values: [data] });
  });

  it("validates every row before returning all row-indexed failures", () => {
    const seen: string[] = [];
    /** Table with a transform recording every candidate. */
    class Observed {
      /** Candidate passed to the transform. */ public name!: string;
    }
    TableMapping.table("observed")(Observed);
    IsString({ min: 3 })(Observed.prototype, "name");
    Transform((value) => {
      seen.push(String(value));
      return value;
    })(Observed.prototype, "name");
    const result = Sql.values(Observed, [{ name: "x" }, { name: "okay" }, { name: "y" }]);
    expect(seen).toEqual(["x", "okay", "y"]);
    expect(result).toMatchObject({
      ok: false,
      issues: [{ path: [0, "name"] }, { path: [2, "name"] }],
    });
    // @ts-expect-error Runtime callers can supply a malformed row in a batch.
    const mixed = Sql.values(Observed, [{ name: "valid" }, { name: "x" }, null]);
    expect(mixed).toMatchObject({
      ok: false,
      issues: [{ path: [1, "name"] }, { path: [2], params: { reason: "invalid_row" } }],
    });
    expect(seen).toEqual(["x", "okay", "y", "valid", "x"]);
  });

  it("rejects sparse batches at the missing row instead of skipping validation", () => {
    const rows: User[] = [{ name: "Ada" }, { name: "unused" }, { name: "Bob" }];
    delete rows[1];
    expect(Sql.values(User, rows)).toMatchObject({
      ok: false,
      issues: [{ path: [1], params: { reason: "invalid_row" } }],
    });
  });

  it("validates indexed batch rows even when the input supplies a custom iterator", () => {
    const rows: User[] = [{ name: "Ada" }, { name: "Bob" }];
    Object.defineProperty(rows, Symbol.iterator, { value: () => [][Symbol.iterator]() });
    const result = Sql.values(User, rows);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected success");
    expect(result.value.compile()).toEqual({
      text: '("name""column", "level") values ($1, $2), ($3, $4)',
      values: ["Ada", 7, "Bob", 7],
    });
  });

  it("captures each row's supplied keys and normalized values before later callbacks run", () => {
    /** Table with a generated field and a cross-row callback. */
    class Snapshot {
      /** Optional generated identifier. */
      public id?: string;
      /** Required name retained as a normalized value. */
      public name!: string;
    }
    TableMapping.table("snapshot")(Snapshot);
    IsString()(Snapshot.prototype, "id");
    Optional()(Snapshot.prototype, "id");
    TableMapping.generated()(Snapshot.prototype, "id");
    IsString()(Snapshot.prototype, "name");
    const first = { id: "one", name: "Ada" };
    const inputs = [first, { id: "two", name: "Bob" }];
    let previous: Snapshot | undefined;
    Refine<Snapshot>((value) => {
      if (previous !== undefined) {
        Reflect.deleteProperty(first, "id");
        previous.name = "changed";
      } else {
        inputs.pop();
      }
      previous = value;
      return true;
    }, {})(Snapshot);
    const result = Sql.values(Snapshot, inputs);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected success");
    expect(result.value.compile()).toEqual({
      text: '("id", "name") values ($1, $2), ($3, $4)',
      values: ["one", "Ada", "two", "Bob"],
    });
  });

  it("requires schema omission rules independently of database-owned metadata", () => {
    /** Database-generated and defaulted fields that remain required by the schema. */
    class RequiredBySchema {
      /** Generated identifier without a schema optional marker. */
      public id?: string;
      /** Defaulted database value without a schema optional marker. */
      public role?: string;
      /** Required caller field. */
      public name!: string;
    }
    TableMapping.table("required")(RequiredBySchema);
    IsString()(RequiredBySchema.prototype, "id");
    TableMapping.generated()(RequiredBySchema.prototype, "id");
    IsString()(RequiredBySchema.prototype, "role");
    TableMapping.dbDefault()(RequiredBySchema.prototype, "role");
    IsString()(RequiredBySchema.prototype, "name");
    expect(Sql.values(RequiredBySchema, { name: "Ada" })).toMatchObject({
      ok: false,
      issues: [{ path: ["id"] }, { path: ["role"] }],
    });
  });

  it("propagates table definition errors rather than treating them as validation issues", () => {
    /** Schema without a table declaration. */
    class MissingTable {
      /** Candidate field. */ public name!: string;
    }
    IsString()(MissingTable.prototype, "name");
    expect(() => Sql.values(MissingTable, { name: "Ada" })).toThrow("No table declared");
    expect(() => Sql.set(MissingTable, { name: "Ada" })).toThrow("No table declared");
  });

  it("accepts readonly multi-row input and rejects every inconsistent column set", () => {
    const rows: readonly User[] = [
      { name: "Ada", role: "a" },
      { role: "b", name: "Bob" },
    ];
    const valid = Sql.values(User, rows);
    expect(valid.ok).toBe(true);
    if (!valid.ok) throw new Error("expected success");
    expect(valid.value.compile()).toEqual({
      text: '("name""column", "role", "level") values ($1, $2, $3), ($4, $5, $6)',
      values: ["Ada", "a", 7, "Bob", "b", 7],
    });
    const invalid = Sql.values(User, [
      { name: "Ada", payload: "x" },
      { name: "Bob" },
      { name: "Cal", profile: { displayName: "C", count: 1n } },
    ]);
    expect(invalid).toMatchObject({
      ok: false,
      issues: [
        { path: [1], params: { reason: "mismatched_columns" } },
        { path: [2], params: { reason: "mismatched_columns" } },
      ],
    });
  });

  it("rejects unknown, empty, undefined and non-object input without a fragment", () => {
    expect(Sql.values(User, [])).toMatchObject({
      ok: false,
      issues: [{ params: { reason: "empty_rows" } }],
    });
    // @ts-expect-error Runtime input may violate the static row contract.
    expect(Sql.values(User, null)).toMatchObject({
      ok: false,
      issues: [{ params: { reason: "invalid_row" } }],
    });
    // @ts-expect-error Runtime input may be an incomplete row.
    expect(Sql.values(User, {})).toMatchObject({
      ok: false,
      issues: [{ params: { reason: "empty_row" } }, { path: ["name"] }],
    });
    // @ts-expect-error Runtime input can include an undeclared field.
    expect(Sql.values(User, { name: "Ada", wire_name: "unknown" })).toMatchObject({
      ok: false,
      issues: [{ path: ["wire_name"], params: { reason: "unknown_property" } }],
    });
    const symbol = Symbol("unknown");
    // @ts-expect-error Runtime input can include an undeclared symbol field.
    expect(Sql.values(User, { name: "Ada", [symbol]: 1 })).toMatchObject({
      ok: false,
      issues: [{ path: [], params: { reason: "unknown_property" } }],
    });
    expect(Sql.values(User, { name: "Ada", payload: undefined })).toMatchObject({
      ok: false,
      issues: [{ path: ["payload"], params: { reason: "undefined_input" } }],
    });
    expect(Sql.values(User, { name: "Ada", vanish: "drop" })).toMatchObject({
      ok: false,
      issues: [{ path: ["vanish"], params: { reason: "undefined_result" } }],
    });
  });

  it("returns insert validation errors including full class refinements", () => {
    expect(Sql.values(User, { name: "x" })).toMatchObject({
      ok: false,
      issues: [{ path: ["name"] }],
    });
    expect(Sql.values(User, { name: "blocked" })).toMatchObject({
      ok: false,
      issues: [{ message: "blocked name" }],
    });
    expect(
      Sql.values(User, { name: "Ada", profile: { displayName: "ok", count: 0n } }),
    ).toMatchObject({
      ok: false,
      issues: [{ path: ["profile"], message: "count must be positive" }],
    });
  });

  it("updates only supplied fields using partial validation and no top-level defaults", () => {
    const updated = Sql.set(User, { name: " blocked ", role: "editor" });
    expect(updated.ok).toBe(true);
    if (!updated.ok) throw new Error("expected success");
    expect(updated.value.compile()).toEqual({
      text: '"name""column" = $1, "role" = $2',
      values: ["blocked", "editor"],
    });
    expect(Sql.set(User, { name: "x" })).toMatchObject({ ok: false, issues: [{ path: ["name"] }] });
    expect(Sql.set(User, {})).toMatchObject({
      ok: false,
      issues: [{ params: { reason: "empty_row" } }],
    });
    // @ts-expect-error Runtime callers can include properties outside the table mapping.
    expect(Sql.set(User, { wire_name: "unknown" })).toMatchObject({
      ok: false,
      issues: [{ path: ["wire_name"], params: { reason: "unknown_property" } }],
    });
    expect(Sql.set(User, { vanish: "drop" })).toMatchObject({
      ok: false,
      issues: [{ params: { reason: "undefined_result" } }],
    });
    expect(Sql.set(User, { profile: { displayName: "ok", count: 0n } })).toMatchObject({
      ok: false,
      issues: [{ path: ["profile"], message: "count must be positive" }],
    });
    // @ts-expect-error Runtime input may be an array, not a patch.
    expect(Sql.set(User, [])).toMatchObject({
      ok: false,
      issues: [{ params: { reason: "invalid_row" } }],
    });
  });
});
