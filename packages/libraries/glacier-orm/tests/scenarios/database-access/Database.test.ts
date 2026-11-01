import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import pg from "pg";
import { IsArray, IsBigInt, IsInt, IsString } from "@glacier/schema";
import {
  Database,
  DbFactory,
  NoRowsError,
  RowValidationError,
  Sql,
  TableMapping,
  TooManyRowsError,
  UniqueViolation,
} from "../../../index.js";
import type { IQueryEvent } from "../../../index.js";
import { PostgresContainer } from "../../data/PostgresContainer.js";

/** A simple validated PostgreSQL row. */
class Item {
  /** Identifier returned by PostgreSQL. */
  public id!: number;
  /** Value returned by PostgreSQL. */
  public value!: string;
}
IsInt()(Item.prototype, "id");
IsString()(Item.prototype, "value");

describe("database access against PostgreSQL", () => {
  let postgres: PostgresContainer;
  let database: Database;
  let schema: string;
  let events: IQueryEvent[];

  beforeAll(async () => {
    postgres = await PostgresContainer.start();
  }, 120_000);
  afterAll(async () => {
    if (postgres !== undefined) await postgres.stop();
  }, 120_000);
  beforeEach(async () => {
    const isolated = await postgres.createSchema();
    schema = isolated.name;
    events = [];
    database = DbFactory.create({
      poolConfig: { ...isolated.config, max: 1 },
      onQuery: (event) => {
        events.push(event);
      },
    });
    await database.pool.query(
      "create table items (id integer primary key, value text not null unique)",
    );
  });
  afterEach(async () => {
    await database.close();
    await postgres.dropSchema(schema);
  });

  it("maps zero or more rows and binds values for query and many", async () => {
    expect(await database.query(Item, Sql.tag`select * from items`)).toEqual([]);
    expect(
      await database.execute(
        Sql.tag`insert into items values (${1}, ${"secret"}), (${2}, ${"other"})`,
      ),
    ).toBe(2);
    const rows = await database.many(
      Item,
      Sql.tag`select * from items where id >= ${1} order by id`,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toBeInstanceOf(Item);
    expect(rows).toMatchObject([
      { id: 1, value: "secret" },
      { id: 2, value: "other" },
    ]);
    expect(events[1]?.text).toContain("$1");
    expect(JSON.stringify(events)).not.toContain("secret");
    expect(events[1]?.rowCount).toBe(2);
    expect(events[1]?.durationMs).toBeGreaterThanOrEqual(0);
    expect(events[1]?.error).toBeUndefined();
    expect(await database.execute(Sql.tag`delete from items where id = ${99}`)).toBe(0);
  });

  it("maps database columns and nested JSON through schema coercion", async () => {
    /** A nested projection returned from PostgreSQL JSON. */
    class Nested {
      /** Numeric value encoded as JSON text. */
      public amount!: number;
    }
    IsInt()(Nested.prototype, "amount");
    /** A table projection with a snake-case database identifier. */
    class Projection {
      /** PostgreSQL int8 identifier. */
      public itemId!: bigint;
      /** Nested JSON items. */
      public entries!: Nested[];
    }
    TableMapping.table("projection")(Projection);
    IsBigInt()(Projection.prototype, "itemId");
    IsArray(Nested)(Projection.prototype, "entries");
    const result = await database.one(
      Projection,
      Sql.tag`
      select ${"9223372036854775807"}::bigint as item_id,
             json_build_array(json_build_object('amount', ${"12"}::text)) as entries
    `,
    );
    expect(result).toBeInstanceOf(Projection);
    expect(result.itemId).toBe(9223372036854775807n);
    expect(result.entries[0]).toBeInstanceOf(Nested);
    expect(result.entries[0]?.amount).toBe(12);
    expect(JSON.stringify(events)).not.toContain("9223372036854775807");
  });

  it("enforces cardinality before row validation and returns optional results", async () => {
    expect(await database.maybeOne(Item, Sql.tag`select * from items`)).toBeUndefined();
    await expect(database.one(Item, Sql.tag`select * from items`)).rejects.toBeInstanceOf(
      NoRowsError,
    );
    await database.execute(Sql.tag`insert into items values (1, 'a'), (2, 'b')`);
    expect(await database.one(Item, Sql.tag`select * from items where id = ${1}`)).toMatchObject({
      id: 1,
    });
    expect(
      await database.maybeOne(Item, Sql.tag`select * from items where id = ${2}`),
    ).toMatchObject({ id: 2 });
    await expect(database.one(Item, Sql.tag`select * from items`)).rejects.toBeInstanceOf(
      TooManyRowsError,
    );
    await expect(database.maybeOne(Item, Sql.tag`select * from items`)).rejects.toBeInstanceOf(
      TooManyRowsError,
    );
    await expect(
      database.query(Item, Sql.tag`select 'invalid' as id, 'secret' as value`),
    ).rejects.toBeInstanceOf(RowValidationError);
  });

  it("maps database errors, protects hook details, and returns pool clients after failures", async () => {
    await database.execute(Sql.tag`insert into items values (1, ${"private-value"})`);
    await expect(
      database.execute(Sql.tag`insert into items values (2, ${"private-value"})`),
    ).rejects.toBeInstanceOf(UniqueViolation);
    const event = events.at(-1);
    expect(event?.error).toBeInstanceOf(Error);
    expect(event?.error?.message).not.toContain("private-value");
    expect(event?.rowCount).toBeNull();
    expect(JSON.stringify(event)).not.toContain("private-value");
    await expect(database.query(Item, Sql.tag`select * from items`)).resolves.toHaveLength(1);
    await expect(database.execute(Sql.tag`create table another (id integer)`)).resolves.toBeNull();
    await expect(database.query(Item, Sql.tag`select * from missing_table`)).rejects.toThrow();
    await expect(database.query(Item, Sql.tag`select * from items`)).resolves.toHaveLength(1);
  });

  it("preserves single and ordered multi-statement counts including missing counts", async () => {
    expect(await database.execute(Sql.tag`create table more_items (id integer)`)).toBeNull();
    const result = await database.execute(Sql.tag`
      insert into items values (1, 'a'), (2, 'b');
      update items set value = 'updated' where id = 1;
      create table last_items (id integer);
      delete from items where id = 99;
      select * from items;
    `);
    expect(result).toEqual([2, 1, null, 0, 2]);
    expect(events.at(-1)?.rowCount).toEqual([2, 1, null, 0, 2]);
    expect(await database.query(Item, Sql.tag`select * from items order by id`)).toMatchObject([
      { id: 1, value: "updated" },
      { id: 2, value: "b" },
    ]);
  });

  it("rejects all row-returning methods on multi-result SQL after execution", async () => {
    const multi = Sql.tag`select * from items; select * from items`;
    await expect(database.query(Item, multi)).rejects.toThrow("Multiple statement results");
    await expect(database.many(Item, multi)).rejects.toThrow("Multiple statement results");
    await expect(database.one(Item, multi)).rejects.toThrow("Multiple statement results");
    await expect(database.maybeOne(Item, multi)).rejects.toThrow("Multiple statement results");
    await expect(
      database.query(Item, Sql.tag`insert into items values (1, 'persisted'); select * from items`),
    ).rejects.toThrow("Multiple statement results");
    expect(events.at(-1)?.rowCount).toEqual([1, 1]);
    expect(await database.one(Item, Sql.tag`select * from items`)).toMatchObject({
      value: "persisted",
    });
  });

  it("reports PostgreSQL's parameterized multi-statement restriction without leaking values", async () => {
    const secret = "sensitive-parameter";
    await expect(
      database.execute(Sql.tag`insert into items values (1, ${secret}); select * from items`),
    ).rejects.toThrow("PostgreSQL query failed");
    expect(events.at(-1)?.error?.message).toBe("PostgreSQL query failed");
    expect(JSON.stringify(events.at(-1))).not.toContain(secret);
    expect(await database.query(Item, Sql.tag`select * from items`)).toEqual([]);
  });

  it("hides unknown server messages while retaining their diagnostic cause", async () => {
    const secret = "sensitive-invalid-number";
    try {
      await database.execute(Sql.tag`select ${secret}::integer`);
      throw new Error("Expected invalid input");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      if (!(error instanceof Error)) throw error;
      expect(error.message).toBe("PostgreSQL query failed");
      expect(error.message).not.toContain(secret);
      expect(error.cause).toBeInstanceOf(Error);
      if (error.cause instanceof Error) expect(error.cause.message).toContain(secret);
      expect(events.at(-1)?.error?.message).not.toContain(secret);
    }
    await expect(database.query(Item, Sql.tag`select * from items`)).resolves.toEqual([]);
  });

  it("owns supplied pools, uses lazy default pools, and rejects conflicting pool options", async () => {
    const pool = new pg.Pool();
    expect(() => DbFactory.create({ pool, poolConfig: {} })).toThrow(TypeError);
    const supplied = DbFactory.create({ pool });
    expect(supplied.pool).toBe(pool);
    await supplied.close();
    const lazy = DbFactory.create({});
    expect(lazy.pool.totalCount).toBe(0);
    await lazy.close();
  });

  it("keeps observer failures observable without concealing simultaneous database failures", async () => {
    const hookFailure = new Error("observer failed");
    const observed = new Database(database.pool, () => {
      throw hookFailure;
    });
    await expect(observed.execute(Sql.tag`delete from items`)).rejects.toBe(hookFailure);
    await expect(observed.query(Item, Sql.tag`select * from missing_table`)).rejects.toMatchObject({
      message: "PostgreSQL query and observer failed",
      errors: [expect.any(Error), hookFailure],
    });
    await expect(database.query(Item, Sql.tag`select * from items`)).resolves.toEqual([]);
  });

  it("awaits asynchronous observers and propagates rejected observations", async () => {
    let completed = false;
    const observed = new Database(database.pool, async () => {
      await Promise.resolve();
      completed = true;
    });
    await observed.query(Item, Sql.tag`select * from items`);
    expect(completed).toBe(true);
    const failure = new Error("async observer failed");
    const rejecting = new Database(database.pool, async () => {
      await Promise.resolve();
      throw failure;
    });
    await expect(rejecting.query(Item, Sql.tag`select * from items`)).rejects.toBe(failure);
    await expect(rejecting.query(Item, Sql.tag`select * from missing_table`)).rejects.toMatchObject(
      {
        errors: [expect.any(Error), failure],
      },
    );
  });

  it("normalizes non-Error observer failures and preserves their cause", async () => {
    const failure = { detail: "observer failure" };
    const observed = new Database(database.pool, () => {
      throw failure;
    });
    await expect(observed.execute(Sql.tag`select 1`)).rejects.toMatchObject({
      message: "Query observer failed",
      cause: failure,
    });
    await expect(observed.execute(Sql.tag`select * from missing_table`)).rejects.toMatchObject({
      errors: [
        expect.any(Error),
        expect.objectContaining({ message: "Query observer failed", cause: failure }),
      ],
    });
  });

  it("wraps non-Error parameter conversion failures and preserves their cause", async () => {
    const failure = { reason: "invalid parameter" };
    const invalid = {
      toPostgres: () => {
        throw failure;
      },
    };
    await expect(database.execute(Sql.tag`select ${invalid}`)).rejects.toMatchObject({
      message: "PostgreSQL query failed",
      cause: failure,
    });
  });
});
