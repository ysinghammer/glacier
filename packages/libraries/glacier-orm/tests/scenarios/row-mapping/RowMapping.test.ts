import { describe, expect, it } from "vitest";
import {
  Default,
  IsArray,
  IsBigInt,
  IsInt,
  IsNumber,
  IsObject,
  IsString,
  IsUnion,
  Rename,
  Schema,
  SchemaDefinitionError,
} from "@glacier/schema";
import { RowMapper, RowValidationError, TableMapping } from "@glacier/orm";

describe("row mapping", () => {
  it("maps arbitrary result classes with recursive schema coercion and wire aliases", () => {
    /** A nested JSON object with a large integer. */
    class Item {
      /** Integer represented by PostgreSQL as text. */
      public id!: bigint;
      /** Numeric amount represented as text. */
      public amount!: number;
    }
    IsBigInt()(Item.prototype, "id");
    IsNumber()(Item.prototype, "amount");
    Rename("total_amount")(Item.prototype, "amount");
    /** A projection whose aliases follow its schema wire names. */
    class Result {
      /** Count coerced to an integer. */
      public count!: number;
      /** Items supplied by json_agg. */
      public items!: Item[];
      /** One object supplied by json_build_object. */
      public selected!: Item;
    }
    IsInt()(Result.prototype, "count");
    Rename("row_count")(Result.prototype, "count");
    IsArray(Item)(Result.prototype, "items");
    IsObject(Item)(Result.prototype, "selected");
    const row = {
      row_count: "2",
      items: [{ id: "9223372036854775807", total_amount: "12.50" }],
      selected: { id: "7", total_amount: "0.25" },
      extra: "ignored",
    };
    const [result] = RowMapper.map(Result, [row]);
    expect(result).toBeInstanceOf(Result);
    expect(result?.items[0]).toBeInstanceOf(Item);
    expect(result).toMatchObject({
      count: 2,
      items: [{ id: 9223372036854775807n, amount: 12.5 }],
      selected: { id: 7n, amount: 0.25 },
    });
    expect(row.row_count).toBe("2");
    expect(result).not.toHaveProperty("extra");
    expect(RowMapper.map(Result, [])).toEqual([]);
  });

  it("maps inherited table columns to wire names with overrides and without mutating rows", () => {
    /** Base table contributes a field and its database column. */
    class Base {
      /** Inherited identifier. */
      public userId!: bigint;
    }
    IsBigInt()(Base.prototype, "userId");
    TableMapping.table("users")(Base);
    /** Child customizes the wire and database names independently. */
    class User extends Base {
      /** Display name with explicit column and wire names. */
      public displayName!: string;
      /** Schema rename also acts as a column without an override. */
      public nickName!: string;
      /** Ordinary camel-case fields use snake-case columns. */
      public createdAt!: string;
    }
    Rename("identifier")(User.prototype, "userId");
    TableMapping.column("user_id")(User.prototype, "userId");
    IsString()(User.prototype, "displayName");
    Rename("wire_name")(User.prototype, "displayName");
    TableMapping.column("db_name")(User.prototype, "displayName");
    IsString()(User.prototype, "nickName");
    Rename("nickname")(User.prototype, "nickName");
    IsString()(User.prototype, "createdAt");
    const row = {
      user_id: "42",
      db_name: "Ada",
      nickname: "ace",
      created_at: "today",
      wire_name: "wrong",
    };
    expect(RowMapper.map(User, [row])).toMatchObject([
      { userId: 42n, displayName: "Ada", nickName: "ace", createdAt: "today" },
    ]);
    expect(row.created_at).toBe("today");
    expect(() =>
      RowMapper.map(User, [
        { user_id: "42", wire_name: "Ada", nickname: "ace", created_at: "today" },
      ]),
    ).toThrow(RowValidationError);
  });

  it("reports the first invalid row with schema issues and a secret-safe summary", () => {
    /** Count must be a nonnegative integer. */
    class Result {
      /** Validated numeric count. */
      public count!: number;
    }
    IsInt({ min: 0 })(Result.prototype, "count");
    const secret = "secret-row-value";
    try {
      RowMapper.map(Result, [{ count: "1" }, { count: secret }, { count: "-1" }]);
      throw new Error("Expected invalid row");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(RowValidationError);
      if (!(error instanceof RowValidationError)) throw error;
      expect(error.rowIndex).toBe(1);
      expect(error.issues.length).toBeGreaterThan(0);
      expect(Schema.isError(error.cause)).toBe(true);
      if (Schema.isError(error.cause)) expect(error.issues).toEqual(error.cause.issues);
      expect(error.message).not.toContain(secret);
    }
    expect(() => RowMapper.map(Result, [null])).toThrow(RowValidationError);
    expect(() => RowMapper.map(Result, Array(1))).toThrow(RowValidationError);
  });

  it("leaves invalid table row shapes for schema validation and supports null-prototype rows", () => {
    /** Simple table with one field. */
    class Item {
      /** Text value. */
      public value!: string;
    }
    TableMapping.table("items")(Item);
    IsString()(Item.prototype, "value");
    const row: Record<string, unknown> = Object.create(null);
    row.value = "ok";
    expect(RowMapper.map(Item, [row])[0]?.value).toBe("ok");
    for (const invalid of [null, 1, [], new Date()]) {
      expect(() => RowMapper.map(Item, [invalid])).toThrow(RowValidationError);
    }
    expect(RowMapper.map(Item, [])).toEqual([]);
    expect(() => TableMapping.column("later")(Item.prototype, "value")).toThrow(/frozen/);
  });

  it("supports root union result classes without attempting table field inspection", () => {
    /** Union root represents multiple query result variants. */
    abstract class Result {}
    /** Concrete variant with a coercible count. */
    class Count extends Result {
      /** Count returned by the query. */
      public count!: number;
    }
    IsInt()(Count.prototype, "count");
    IsUnion({ discriminator: "kind", variants: { count: Count } })(Result);
    const [result] = RowMapper.map(Result, [{ kind: "count", count: "3" }]);
    expect(result).toBeInstanceOf(Count);
    expect(result).toMatchObject({ count: 3 });
    expect(() => RowMapper.map(Result, [{ kind: "unknown" }])).toThrow(RowValidationError);
  });

  it("fails invalid table mappings even with no rows instead of silently falling back", () => {
    /** A valid table is prepared even when the result contains no rows. */
    class Empty {}
    TableMapping.table("empty")(Empty);
    IsString()(Empty.prototype, "name");
    expect(RowMapper.map(Empty, [])).toEqual([]);
    expect(() => TableMapping.column("later")(Empty.prototype, "name")).toThrow(/frozen/);
    /** Two distinct properties collide as database columns. */
    class Collision {}
    TableMapping.table("collision")(Collision);
    IsString()(Collision.prototype, "userId");
    IsString()(Collision.prototype, "user_id");
    expect(() => RowMapper.map(Collision, [])).toThrow(/both map to user_id/);
  });

  it("preserves nested validation issue paths from JSON arrays", () => {
    /** Nested amount must be numeric. */
    class Item {}
    IsNumber()(Item.prototype, "amount");
    /** Result contains a JSON array. */
    class Result {}
    IsArray(Item)(Result.prototype, "items");
    try {
      RowMapper.map(Result, [{ items: [{ amount: "bad" }] }]);
      throw new Error("Expected invalid row");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(RowValidationError);
      if (!(error instanceof RowValidationError)) throw error;
      expect(error.rowIndex).toBe(0);
      expect(error.issues[0]?.path).toEqual(["items", 0, "amount"]);
    }
  });

  it("propagates schema definition and callback exceptions instead of treating them as mismatches", () => {
    /** Invalid nested schema definition. */
    class Broken {}
    IsObject(() => undefined)(Broken.prototype, "value");
    expect(() => RowMapper.map(Broken, [{ value: {} }])).toThrow(SchemaDefinitionError);
    /** Default callback failures remain observable. */
    class Throwing {}
    const failure = new Error("callback failed");
    IsString()(Throwing.prototype, "value");
    Default(() => {
      throw failure;
    })(Throwing.prototype, "value");
    expect(() => RowMapper.map(Throwing, [{}])).toThrow(failure);
  });

  it("inspects table inheritance without freezing metadata and rejects invalid targets", () => {
    /** Table declared after a non-freezing inspection. */
    class Base {}
    expect(TableMapping.isTable(Base)).toBe(false);
    TableMapping.table("base")(Base);
    /** Inherits the table declaration. */
    class Child extends Base {}
    expect(TableMapping.isTable(Child)).toBe(true);
    IsString()(Child.prototype, "name");
    TableMapping.column("db_name")(Child.prototype, "name");
    expect(TableMapping.read(Child).table).toBe("base");
    // @ts-expect-error Runtime callers can pass an invalid target.
    expect(() => TableMapping.isTable({})).toThrow(/Invalid metadata target/);
  });
});
