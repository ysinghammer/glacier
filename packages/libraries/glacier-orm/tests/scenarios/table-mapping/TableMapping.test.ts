import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import {
  IsObject,
  IsString,
  IsUnion,
  Optional,
  Rename,
  Schema,
  SchemaDefinitionError,
} from "@glacier/schema";
import { TableMapping } from "../../../index.js";

describe("table mapping", () => {
  it("reads mappings from genuine compiled legacy decorators through package roots", () => {
    const output = execFileSync(
      process.execPath,
      [new URL("../../artifacts/compiler/DecoratedTable.js", import.meta.url).pathname],
      { encoding: "utf8" },
    );
    expect(JSON.parse(output)).toEqual({
      table: "users",
      column: "db_name",
      wire: "wire_name",
      optional: ["id"],
    });
  });
  it("resolves decorator declarations, aliases, column overrides and optional database fields", () => {
    /** A schema-backed table with explicit and default database names. */
    class User {
      /** Generated identifiers are optional in TypeScript as well as ORM metadata. */
      public id?: string;

      /** Input alias remains distinct from an explicitly overridden database column. */
      public displayName!: string;

      /** Database default permits omission; schema Optional allows parsing without it. */
      public createdAt?: string;

      /** Explicit same-name Rename must override snake-case fallback. */
      public userID!: string;

      /** Acronym boundaries use snake case by default. */
      public HTTPStatus!: string;

      /** An explicit schema alias is also the database name when no column is specified. */
      public nickname!: string;
    }
    TableMapping.table("public.Users")(User);
    IsString()(User.prototype, "id");
    Optional()(User.prototype, "id");
    TableMapping.generated()(User.prototype, "id");
    IsString()(User.prototype, "displayName");
    Rename("display_wire")(User.prototype, "displayName");
    TableMapping.column('display"column')(User.prototype, "displayName");
    IsString()(User.prototype, "createdAt");
    Optional()(User.prototype, "createdAt");
    TableMapping.dbDefault()(User.prototype, "createdAt");
    IsString()(User.prototype, "userID");
    Rename("userID")(User.prototype, "userID");
    IsString()(User.prototype, "HTTPStatus");
    IsString()(User.prototype, "nickname");
    Rename("nick_wire")(User.prototype, "nickname");
    const mapping = TableMapping.read(User);
    expect(mapping.table).toBe("public.Users");
    expect(mapping.columns).toEqual([
      {
        property: "id",
        column: "id",
        wireName: "id",
        isGenerated: true,
        hasDbDefault: false,
        isInsertOptional: true,
      },
      {
        property: "displayName",
        column: 'display"column',
        wireName: "display_wire",
        isGenerated: false,
        hasDbDefault: false,
        isInsertOptional: false,
      },
      {
        property: "createdAt",
        column: "created_at",
        wireName: "createdAt",
        isGenerated: false,
        hasDbDefault: true,
        isInsertOptional: true,
      },
      {
        property: "userID",
        column: "userID",
        wireName: "userID",
        isGenerated: false,
        hasDbDefault: false,
        isInsertOptional: false,
      },
      {
        property: "HTTPStatus",
        column: "http_status",
        wireName: "HTTPStatus",
        isGenerated: false,
        hasDbDefault: false,
        isInsertOptional: false,
      },
      {
        property: "nickname",
        column: "nick_wire",
        wireName: "nick_wire",
        isGenerated: false,
        hasDbDefault: false,
        isInsertOptional: false,
      },
    ]);
    expect(mapping.propertyToColumn.displayName).toBe('display"column');
    expect(mapping.columnToProperty['display"column']).toBe("displayName");
    expect(mapping.insertOptionalProperties).toEqual(["id", "createdAt"]);
    expect(Object.getPrototypeOf(mapping.propertyToColumn)).toBeNull();
    expect(Object.getPrototypeOf(mapping.columnToProperty)).toBeNull();
    expect(Object.isFrozen(mapping)).toBe(true);
    expect(Object.isFrozen(mapping.columns)).toBe(true);
    expect(mapping.columns.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(mapping.propertyToColumn)).toBe(true);
    expect(Object.isFrozen(mapping.columnToProperty)).toBe(true);
    expect(Object.isFrozen(mapping.insertOptionalProperties)).toBe(true);
    expect(
      Schema.parse(User, { display_wire: "Ada", userID: "u", HTTPStatus: "ok", nick_wire: "ace" }),
    ).toMatchObject({ displayName: "Ada", userID: "u", HTTPStatus: "ok", nickname: "ace" });
  });

  it("inherits tables and annotations, merges descendant overrides and freezes ancestors", () => {
    /** Base table holding inherited mappings. */
    class Base {}
    TableMapping.table("base")(Base);
    IsString()(Base.prototype, "userId");
    TableMapping.column("parent_column")(Base.prototype, "userId");
    TableMapping.generated()(Base.prototype, "userId");
    IsString()(Base.prototype, "label");
    /** Child overrides the inherited column and adds a default marker. */
    class Child extends Base {}
    TableMapping.table("child")(Child);
    Rename("child_wire")(Child.prototype, "userId");
    TableMapping.column("child_column")(Child.prototype, "userId");
    TableMapping.dbDefault()(Child.prototype, "userId");
    const mapping = TableMapping.read(Child);
    expect(mapping.table).toBe("child");
    expect(mapping.columns[0]).toEqual({
      property: "userId",
      wireName: "child_wire",
      column: "child_column",
      isGenerated: true,
      hasDbDefault: true,
      isInsertOptional: true,
    });
    expect(mapping.propertyToColumn.label).toBe("label");
    expect(() => TableMapping.column("late")(Base.prototype, "label")).toThrow(/frozen/);
    expect(() => TableMapping.generated()(Child.prototype, "label")).toThrow(/frozen/);
    expect(() => TableMapping.dbDefault()(Child.prototype, "label")).toThrow(/frozen/);
    expect(() => TableMapping.table("later")(Base)).toThrow(/frozen/);
    expect(() => Rename("late")(Base.prototype, "label")).toThrow(SchemaDefinitionError);
    expect(TableMapping.read(Base).table).toBe("base");
    /** A new descendant can still declare its own table after ancestor freezing. */
    class Other extends Base {}
    expect(TableMapping.read(Other).table).toBe("base");
    expect(TableMapping.read(Other).propertyToColumn.userId).toBe("parent_column");
  });

  it("keeps independent schema preparation separate until a table mapping is read", () => {
    /** Independently prepared schema. */
    class Prepared {}
    IsString()(Prepared.prototype, "name");
    Schema.prepare(Prepared);
    TableMapping.table("prepared")(Prepared);
    TableMapping.column("db_name")(Prepared.prototype, "name");
    expect(TableMapping.read(Prepared).propertyToColumn.name).toBe("db_name");
    expect(() => TableMapping.column("other")(Prepared.prototype, "name")).toThrow(/frozen/);
  });

  it("supports empty tables and reserved property names without prototype leakage", () => {
    /** A table without fields. */
    class Empty {}
    TableMapping.table("empty")(Empty);
    expect(TableMapping.read(Empty).columns).toEqual([]);
    /** A field and column named like an object prototype property. */
    class Reserved {}
    IsString()(Reserved.prototype, "__proto__");
    TableMapping.column("constructor")(Reserved.prototype, "__proto__");
    TableMapping.table("reserved")(Reserved);
    const mapping = TableMapping.read(Reserved);
    expect(mapping.propertyToColumn["__proto__"]).toBe("constructor");
    expect(mapping.columnToProperty.constructor).toBe("__proto__");
    expect(mapping.propertyToColumn.toString).toBeUndefined();
  });

  it("rejects invalid names, invalid targets, static or symbol fields and duplicate declarations", () => {
    expect(() => TableMapping.table("")).toThrow(TypeError);
    expect(() => TableMapping.column("a\0b")).toThrow(TypeError);
    // @ts-expect-error Runtime callers can violate the identifier type.
    expect(() => TableMapping.table(1)).toThrow(TypeError);
    /** Target used for invalid and duplicated decorators. */
    class Target {
      /** Method decorator use is not a property declaration. */
      public method(): void {}
    }
    const symbol = Symbol("name");
    expect(() => TableMapping.column("x")(Target.prototype, symbol)).toThrow(TypeError);
    expect(() => TableMapping.generated()(Target.prototype, symbol)).toThrow(TypeError);
    expect(() => TableMapping.dbDefault()(Target.prototype, symbol)).toThrow(TypeError);
    expect(() => TableMapping.column("x")(Target, "staticField")).toThrow(TypeError);
    expect(() => TableMapping.generated()(new Target(), "name")).toThrow(TypeError);
    expect(() => TableMapping.dbDefault()(Target.prototype, "method")).toThrow(TypeError);
    TableMapping.table("one")(Target);
    expect(() => TableMapping.table("two")(Target)).toThrow(/already declared/);
    TableMapping.column("first")(Target.prototype, "name");
    expect(() => TableMapping.column("second")(Target.prototype, "name")).toThrow(
      /Duplicate column/,
    );
    TableMapping.generated()(Target.prototype, "name");
    expect(() => TableMapping.generated()(Target.prototype, "name")).toThrow(/Duplicate generated/);
    TableMapping.dbDefault()(Target.prototype, "name");
    expect(() => TableMapping.dbDefault()(Target.prototype, "name")).toThrow(/Duplicate dbDefault/);
    // @ts-expect-error Runtime callers can supply a nonclass.
    expect(() => TableMapping.read({})).toThrow(/Invalid metadata target/);
    expect(() => TableMapping.table("bad")(() => {})).toThrow(/Invalid metadata target/);
  });

  it("rejects missing tables, unknown annotations and duplicate effective columns without freezing", () => {
    /** Table decorator can still be added after a failed read. */
    class Missing {}
    expect(() => TableMapping.read(Missing)).toThrow(/No table/);
    TableMapping.table("missing")(Missing);
    TableMapping.column("a")(Missing.prototype, "value");
    expect(() => TableMapping.read(Missing)).toThrow(/no schema declaration/);
    IsString()(Missing.prototype, "value");
    expect(TableMapping.read(Missing).propertyToColumn.value).toBe("a");
    /** Names differ in schema but collide under snake casing. */
    class Collision {}
    TableMapping.table("collision")(Collision);
    IsString()(Collision.prototype, "userId");
    IsString()(Collision.prototype, "user_id");
    expect(() => TableMapping.read(Collision)).toThrow(/both map to user_id/);
    TableMapping.column("different")(Collision.prototype, "user_id");
    expect(TableMapping.read(Collision).columnToProperty.different).toBe("user_id");
  });

  it("propagates schema mapping and preparation errors with their distinct freeze effects", () => {
    /** Schema wire keys collide independently of database overrides. */
    class Collision {}
    TableMapping.table("collision")(Collision);
    IsString()(Collision.prototype, "a");
    IsString()(Collision.prototype, "b");
    Rename("a")(Collision.prototype, "b");
    expect(() => TableMapping.read(Collision)).toThrow(SchemaDefinitionError);
    expect(() => TableMapping.column("different")(Collision.prototype, "b")).not.toThrow();
    /** Root unions do not have one set of effective object fields. */
    class Union {}
    TableMapping.table("union")(Union);
    IsUnion({ discriminator: "type", variants: { collision: Collision } })(Union);
    expect(() => TableMapping.read(Union)).toThrow(SchemaDefinitionError);
    /** Invalid implicit database identifier is not accepted. */
    class Invalid {}
    TableMapping.table("invalid")(Invalid);
    IsString()(Invalid.prototype, "");
    expect(() => TableMapping.read(Invalid)).toThrow(TypeError);
    /** A failed nested preparation freezes both schema and ORM declarations. */
    class Broken {}
    TableMapping.table("broken")(Broken);
    IsObject(() => undefined)(Broken.prototype, "nested");
    expect(() => TableMapping.read(Broken)).toThrow(SchemaDefinitionError);
    expect(() => IsString()(Broken.prototype, "later")).toThrow(SchemaDefinitionError);
    expect(() => TableMapping.column("nested_column")(Broken.prototype, "nested")).toThrow(
      /frozen/,
    );
  });

  it("freezes ORM declarations before invoking nested schema type resolvers", () => {
    /** A valid nested schema. */
    class Nested {}
    /** Resolver attempts to change an annotation after the mapping snapshot was computed. */
    class Root {}
    TableMapping.table("root")(Root);
    let attempts = 0;
    IsObject(() => {
      attempts++;
      expect(() => TableMapping.column("late")(Root.prototype, "nested")).toThrow(/frozen/);
      return Nested;
    })(Root.prototype, "nested");
    expect(TableMapping.read(Root).propertyToColumn.nested).toBe("nested");
    expect(attempts).toBeGreaterThan(0);
  });
});
