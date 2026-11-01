import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { IsInt, IsString } from "@glacier/schema";
import {
  CommittedObserverError,
  CommittedReleaseError,
  Database,
  DbFactory,
  Sql,
  UniqueViolation,
} from "@glacier/orm";
import type { IQueryable, IQueryEvent, ITransactionOptions } from "@glacier/orm";
import { PostgresContainer } from "../../data/PostgresContainer.js";
import type { PoolClient } from "pg";

/** A row used to inspect transactional effects. */
class Item {
  /** Integer identifier. */
  public id!: number;
  /** Stored value. */
  public value!: string;
}
IsInt()(Item.prototype, "id");
IsString()(Item.prototype, "value");

/** PostgreSQL's reported transaction isolation. */
class Isolation {
  /** Server-reported level. */
  public transaction_isolation!: string;
}
IsString()(Isolation.prototype, "transaction_isolation");

describe("transactions against PostgreSQL", () => {
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
      poolConfig: { ...isolated.config, max: 1, connectionTimeoutMillis: 100 },
      onQuery: async (event) => {
        await Promise.resolve();
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

  it("commits on a dedicated client, returns results, and rejects settled handles", async () => {
    let captured: IQueryable | undefined;
    const result = await database.transaction(async (tx) => {
      captured = tx;
      await tx.execute(Sql.tag`insert into items values (${1}, ${"sensitive"})`);
      expect(await tx.one(Item, Sql.tag`select * from items`)).toMatchObject({ id: 1 });
      return "result";
    });
    expect(result).toBe("result");
    expect(await database.many(Item, Sql.tag`select * from items`)).toHaveLength(1);
    expect(events.map((event) => event.text)).toContain("COMMIT");
    expect(JSON.stringify(events)).not.toContain("sensitive");
    if (captured === undefined) throw new Error("Missing transaction handle");
    await expect(captured.execute(Sql.tag`select 1`)).rejects.toThrow("not available");
    await expect(captured.transaction(async () => 1)).rejects.toThrow("not available");
    expect(database.pool.idleCount).toBe(1);
  });

  it("rolls back callback and SQL failures and releases its client", async () => {
    const failure = new Error("callback failed");
    await expect(
      database.transaction(async (tx) => {
        await tx.execute(Sql.tag`insert into items values (1, 'a')`);
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(await database.query(Item, Sql.tag`select * from items`)).toEqual([]);
    await expect(
      database.transaction(async (tx) => {
        await tx.execute(Sql.tag`insert into items values (1, 'a'), (1, 'b')`);
      }),
    ).rejects.toBeInstanceOf(UniqueViolation);
    expect(database.pool.idleCount).toBe(1);
    expect(events.map((event) => event.text).filter((text) => text === "ROLLBACK")).toHaveLength(2);
  });

  it("detects PostgreSQL's silent rollback when a callback catches an SQL error", async () => {
    await expect(
      database.transaction(async (tx) => {
        await tx.execute(Sql.tag`insert into items values (1, 'a')`);
        await expect(tx.execute(Sql.tag`insert into items values (1, 'b')`)).rejects.toBeInstanceOf(
          UniqueViolation,
        );
      }),
    ).rejects.toThrow("rolled back");
    expect(await database.query(Item, Sql.tag`select * from items`)).toEqual([]);
  });

  it("rolls back nested work, releases savepoints, and keeps outer work", async () => {
    let nested: IQueryable | undefined;
    const failure = new Error("nested failed");
    await database.transaction(async (tx) => {
      await tx.execute(Sql.tag`insert into items values (1, 'outer')`);
      await expect(
        tx.transaction(async (child) => {
          nested = child;
          await child.execute(Sql.tag`insert into items values (2, 'nested')`);
          throw failure;
        }),
      ).rejects.toBe(failure);
      await tx.transaction(async (child) => {
        await child.transaction(async (grandchild) => {
          await grandchild.execute(Sql.tag`insert into items values (3, 'grandchild')`);
        });
      });
    });
    expect(await database.many(Item, Sql.tag`select * from items order by id`)).toMatchObject([
      { id: 1 },
      { id: 3 },
    ]);
    expect(events.some((event) => event.text.startsWith("ROLLBACK TO SAVEPOINT"))).toBe(true);
    expect(events.filter((event) => event.text.startsWith("RELEASE SAVEPOINT"))).toHaveLength(3);
    if (nested === undefined) throw new Error("Missing nested handle");
    await expect(nested.execute(Sql.tag`select 1`)).rejects.toThrow("not available");
  });

  it.each(["read committed", "repeatable read", "serializable"] as const)(
    "sets %s isolation",
    async (isolation) => {
      await database.transaction(
        async (tx) => {
          expect(
            (await tx.one(Isolation, Sql.tag`show transaction_isolation`)).transaction_isolation,
          ).toBe(isolation);
          await expect(tx.transaction(async () => {}, { isolation })).rejects.toThrow(
            "cannot specify isolation",
          );
        },
        { isolation },
      );
    },
  );

  it("rejects unsupported runtime isolation before acquiring a client", async () => {
    const options: unknown = { isolation: "unsafe; select 1" };
    await expect(
      database.transaction(async () => {}, options as ITransactionOptions),
    ).rejects.toThrow(TypeError);
    expect(database.pool.totalCount).toBe(1);
    expect(events).toEqual([]);
  });

  it("prevents parent use while a nested callback owns the client", async () => {
    await database.transaction(async (tx) => {
      await tx.transaction(async (child) => {
        await expect(tx.execute(Sql.tag`select 1`)).rejects.toThrow("not available");
        await expect(tx.transaction(async () => {})).rejects.toThrow("not available");
        await child.execute(Sql.tag`select 1`);
      });
      await tx.execute(Sql.tag`select 1`);
    });
  });

  it("fails pool exhaustion without losing the checked-out transaction client", async () => {
    await database.transaction(async (tx) => {
      await expect(database.execute(Sql.tag`select 1`)).rejects.toThrow();
      await tx.execute(Sql.tag`insert into items values (1, 'ok')`);
    });
    expect(await database.many(Item, Sql.tag`select * from items`)).toHaveLength(1);
  });

  it("rolls back and releases when a BEGIN observer fails after PostgreSQL began", async () => {
    const failure = new Error("begin observer failed");
    const observed = new Database(database.pool, async (event) => {
      await Promise.resolve();
      if (event.text === "BEGIN") throw failure;
    });
    await expect(
      observed.transaction(async () => {
        throw new Error("must not run");
      }),
    ).rejects.toBe(failure);
    expect(database.pool.idleCount).toBe(1);
    await expect(database.execute(Sql.tag`insert into items values (1, 'ok')`)).resolves.toBe(1);
  });

  it("discards a client when BEGIN itself fails on a real aborted connection", async () => {
    const client = await database.pool.connect();
    await client.query("BEGIN");
    await expect(client.query("select * from missing_table")).rejects.toThrow();
    client.release();
    await expect(database.transaction(async () => {})).rejects.toThrow("PostgreSQL query failed");
    expect(await database.query(Item, Sql.tag`select * from items`)).toEqual([]);
  });

  it("aborts the outer transaction when a successful savepoint release observer fails", async () => {
    const failure = new Error("release observer failed");
    const observed = new Database(database.pool, (event) => {
      if (event.text.startsWith("RELEASE SAVEPOINT")) throw failure;
    });
    await expect(
      observed.transaction(async (tx) => {
        await tx.execute(Sql.tag`insert into items values (1, 'a')`);
        await expect(tx.transaction(async () => {})).rejects.toBe(failure);
      }),
    ).rejects.toBe(failure);
    expect(await database.query(Item, Sql.tag`select * from items`)).toEqual([]);
  });

  it.each([false, true])(
    "preserves pool release failures alongside transaction failure: %s",
    async (shouldFail) => {
      const failure = new Error("callback failed");
      const releaseFailure = new Error("pool release observer failed");
      let released: PoolClient | undefined;
      database.pool.on("error", () => {});
      database.pool.once("release", (_error, client) => {
        released = client;
        throw releaseFailure;
      });
      const run = database.transaction(async (tx) => {
        await tx.execute(Sql.tag`insert into items values (1, 'written')`);
        if (shouldFail) throw failure;
      });
      try {
        if (shouldFail) {
          await expect(run).rejects.toMatchObject({ errors: [failure, releaseFailure] });
        } else {
          await expect(run).rejects.toBeInstanceOf(CommittedReleaseError);
          await expect(run).rejects.toMatchObject({ cause: releaseFailure });
          await expect(run).rejects.toThrow("Transaction committed but its client release failed");
          expect(events.map((event) => event.text)).not.toContain("ROLLBACK");
        }
      } finally {
        if (released !== undefined) released.emit("error", new Error("release interrupted"));
      }
      expect(await database.query(Item, Sql.tag`select * from items`)).toHaveLength(
        shouldFail ? 0 : 1,
      );
    },
  );

  it("does not report committed state when PostgreSQL rolls back at COMMIT and release fails", async () => {
    const releaseFailure = new Error("release failed");
    let released: PoolClient | undefined;
    database.pool.on("error", () => {});
    database.pool.once("release", (_error, client) => {
      released = client;
      throw releaseFailure;
    });
    try {
      const run = database.transaction(async (tx) => {
        await tx.execute(Sql.tag`insert into items values (1, 'a')`);
        await expect(tx.execute(Sql.tag`insert into items values (1, 'b')`)).rejects.toBeInstanceOf(
          UniqueViolation,
        );
      });
      await expect(run).rejects.toMatchObject({
        errors: [
          expect.objectContaining({ message: expect.stringContaining("rolled back") }),
          releaseFailure,
        ],
      });
    } finally {
      if (released !== undefined) released.emit("error", new Error("release interrupted"));
    }
    expect(await database.query(Item, Sql.tag`select * from items`)).toEqual([]);
  });

  it("retains a non-Error release failure as the cause after commit", async () => {
    const releaseFailure = { reason: "release failed" };
    let released: PoolClient | undefined;
    database.pool.on("error", () => {});
    database.pool.once("release", (_error, client) => {
      released = client;
      throw releaseFailure;
    });
    try {
      const run = database.transaction(async () => {});
      await expect(run).rejects.toBeInstanceOf(CommittedReleaseError);
      await expect(run).rejects.toMatchObject({ cause: releaseFailure });
    } finally {
      if (released !== undefined) released.emit("error", new Error("release interrupted"));
    }
  });

  it("preserves both committed-state errors when the observer and client release fail", async () => {
    const observerFailure = new Error("commit observer failed");
    const releaseFailure = new Error("client release failed");
    const observedEvents: string[] = [];
    const observed = new Database(database.pool, async (event) => {
      await Promise.resolve();
      observedEvents.push(event.text);
      if (event.text === "COMMIT") throw observerFailure;
    });
    let released: PoolClient | undefined;
    database.pool.on("error", () => {});
    database.pool.once("release", (_error, client) => {
      released = client;
      throw releaseFailure;
    });
    try {
      const run = observed.transaction(async (tx) => {
        await tx.execute(Sql.tag`insert into items values (1, 'committed')`);
      });
      await expect(run).rejects.toMatchObject({
        errors: [
          expect.objectContaining({ name: "CommittedObserverError", cause: observerFailure }),
          expect.objectContaining({ name: "CommittedReleaseError", cause: releaseFailure }),
        ],
      });
      await expect(run).rejects.toMatchObject({
        errors: [expect.any(CommittedObserverError), expect.any(CommittedReleaseError)],
      });
      expect(observedEvents).not.toContain("ROLLBACK");
    } finally {
      if (released !== undefined) released.emit("error", new Error("release interrupted"));
    }
    expect(await database.one(Item, Sql.tag`select * from items`)).toMatchObject({
      value: "committed",
    });
  });

  it("reports a committed transaction separately if its awaited COMMIT observer fails", async () => {
    const failure = new Error("commit observer failed");
    const observedEvents: string[] = [];
    const observed = new Database(database.pool, async (event) => {
      await Promise.resolve();
      observedEvents.push(event.text);
      if (event.text === "COMMIT") throw failure;
    });
    const transaction = observed.transaction(async (tx) => {
      await tx.execute(Sql.tag`insert into items values (1, 'committed')`);
    });
    await expect(transaction).rejects.toBeInstanceOf(CommittedObserverError);
    await expect(transaction).rejects.toMatchObject({ cause: failure });
    expect(observedEvents).not.toContain("ROLLBACK");
    expect(await database.one(Item, Sql.tag`select * from items`)).toMatchObject({
      value: "committed",
    });
    expect(database.pool.idleCount).toBe(1);
  });

  it("preserves callback and rollback observer failures and discards the client", async () => {
    const failure = new Error("callback failed");
    const rollbackFailure = new Error("rollback observer failed");
    const observed = new Database(database.pool, async (event) => {
      await Promise.resolve();
      if (event.text === "ROLLBACK") throw rollbackFailure;
    });
    await expect(
      observed.transaction(async (tx) => {
        await tx.execute(Sql.tag`insert into items values (1, 'a')`);
        throw failure;
      }),
    ).rejects.toMatchObject({ errors: [failure, rollbackFailure] });
    expect(await database.query(Item, Sql.tag`select * from items`)).toEqual([]);
  });

  it("preserves nested cleanup failure and prevents the outer callback from committing", async () => {
    const nestedFailure = new Error("nested failed");
    const cleanupFailure = new Error("savepoint rollback observer failed");
    const observedEvents: string[] = [];
    const observed = new Database(database.pool, async (event) => {
      observedEvents.push(event.text);
      if (event.text.startsWith("ROLLBACK TO SAVEPOINT")) throw cleanupFailure;
    });
    await expect(
      observed.transaction(async (tx) => {
        await tx.execute(Sql.tag`insert into items values (1, 'a')`);
        await expect(
          tx.transaction(async () => {
            throw nestedFailure;
          }),
        ).rejects.toMatchObject({ errors: [nestedFailure, cleanupFailure] });
      }),
    ).rejects.toMatchObject({ errors: [nestedFailure, cleanupFailure] });
    expect(observedEvents.some((text) => text.startsWith("RELEASE SAVEPOINT"))).toBe(true);
    expect(await database.query(Item, Sql.tag`select * from items`)).toEqual([]);
  });

  it("preserves failures from both savepoint cleanup commands", async () => {
    const nestedFailure = new Error("nested failed");
    const rollbackFailure = new Error("rollback observation failed");
    const releaseFailure = new Error("release observation failed");
    const observed = new Database(database.pool, (event) => {
      if (event.text.startsWith("ROLLBACK TO SAVEPOINT")) throw rollbackFailure;
      if (event.text.startsWith("RELEASE SAVEPOINT")) throw releaseFailure;
    });
    await expect(
      observed.transaction(async (tx) => {
        await tx.transaction(async () => {
          throw nestedFailure;
        });
      }),
    ).rejects.toMatchObject({
      errors: [
        nestedFailure,
        expect.objectContaining({ errors: [rollbackFailure, releaseFailure] }),
      ],
    });
  });

  it("preserves savepoint release failure after a successful rollback", async () => {
    const nestedFailure = new Error("nested failed");
    const releaseFailure = new Error("release observation failed");
    const observed = new Database(database.pool, (event) => {
      if (event.text.startsWith("RELEASE SAVEPOINT")) throw releaseFailure;
    });
    await expect(
      observed.transaction(async (tx) => {
        await tx.transaction(async () => {
          throw nestedFailure;
        });
      }),
    ).rejects.toMatchObject({ errors: [nestedFailure, releaseFailure] });
  });

  it("rolls back after a deferred constraint fails during COMMIT", async () => {
    await database.pool.query(
      "create table deferred_items (id integer unique deferrable initially deferred)",
    );
    await expect(
      database.transaction(async (tx) => {
        await tx.execute(Sql.tag`insert into deferred_items values (1), (1)`);
      }),
    ).rejects.toBeInstanceOf(UniqueViolation);
    const result = await database.pool.query("select count(*)::int as count from deferred_items");
    expect(result.rows[0]?.count).toBe(0);
    expect(database.pool.idleCount).toBe(1);
  });

  it("normalizes non-Error callback exceptions with their original cause", async () => {
    const failure = { reason: "failure" };
    await expect(
      database.transaction(async () => {
        throw failure;
      }),
    ).rejects.toMatchObject({ cause: failure });
  });
});
