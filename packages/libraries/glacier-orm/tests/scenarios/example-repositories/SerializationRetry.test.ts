import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { DbFactory, SerializationFailure, Sql, UniqueViolation } from "@glacier/orm";
import type { Database, IQueryEvent } from "@glacier/orm";
import { PostgresContainer } from "../../data/PostgresContainer.js";
import { ReadBarrier } from "../../data/exampleRepositories/checkout/ReadBarrier.js";
import { RetryCounter } from "../../data/exampleRepositories/checkout/RetryCounter.schema.js";
import { SerializationRetry } from "../../data/exampleRepositories/checkout/SerializationRetry.js";

describe("caller-owned serialization retry against PostgreSQL", () => {
  let postgres: PostgresContainer;
  let database: Database;
  let cleanup: (() => Promise<void>) | undefined;
  let events: IQueryEvent[];

  beforeAll(async () => {
    postgres = await PostgresContainer.start();
  }, 120_000);
  afterAll(async () => {
    if (postgres !== undefined) await postgres.stop();
  }, 120_000);
  beforeEach(async () => {
    cleanup = undefined;
    const isolated = await postgres.createSchema();
    cleanup = async () => {
      await postgres.dropSchema(isolated.name);
    };
    events = [];
    database = DbFactory.create({
      poolConfig: { ...isolated.config, max: 4 },
      onQuery: (event) => {
        events.push(event);
      },
    });
    cleanup = async () => {
      const failures: unknown[] = [];
      try {
        await database.close();
      } catch (error: unknown) {
        failures.push(error);
      }
      try {
        await postgres.dropSchema(isolated.name);
      } catch (error: unknown) {
        failures.push(error);
      }
      if (failures.length > 0) throw new AggregateError(failures, "Retry example cleanup failed");
    };
    await database.execute(Sql.tag`
      create table retry_counter (id integer primary key, value integer not null);
      insert into retry_counter values (1, 0)
    `);
  });
  afterEach(async () => {
    if (cleanup !== undefined) await cleanup();
  });

  it("retries the losing serializable transaction after both first reads overlap", async () => {
    const barrier = new ReadBarrier();
    const observations: {
      worker: number;
      attempt: number;
      value: number;
      transactionId: bigint;
    }[] = [];
    const failures: SerializationFailure[] = [];
    const results = await Promise.allSettled(
      [1, 2].map(async (worker) => {
        try {
          return await SerializationRetry.run(database, 3, async (tx, attempt) => {
            const row = await tx.one(
              RetryCounter,
              Sql.tag`
            select value, txid_current()::text as transaction_id from retry_counter where id = 1
          `,
            );
            observations.push({
              worker,
              attempt,
              value: row.value,
              transactionId: row.transactionId,
            });
            if (attempt === 1) await barrier.wait();
            try {
              await tx.execute(
                Sql.tag`update retry_counter set value = ${row.value + 1} where id = 1`,
              );
            } catch (error: unknown) {
              if (error instanceof SerializationFailure) failures.push(error);
              throw error;
            }
            return row.value + 1;
          });
        } catch (error: unknown) {
          barrier.cancel(
            error instanceof Error ? error : new Error("Retry worker failed", { cause: error }),
          );
          throw error;
        }
      }),
    );
    for (const result of results) {
      if (result.status === "rejected")
        throw new Error("Retry worker failed", { cause: result.reason });
    }
    expect(
      results.map((result) => (result.status === "fulfilled" ? result.value : undefined)).sort(),
    ).toEqual([1, 2]);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toBeInstanceOf(SerializationFailure);
    expect(failures[0]?.code).toBe("40001");
    expect(observations.filter((entry) => entry.attempt === 1).map((entry) => entry.value)).toEqual(
      [0, 0],
    );
    expect(observations.filter((entry) => entry.attempt === 2).map((entry) => entry.value)).toEqual(
      [1],
    );
    expect(new Set(observations.map((entry) => entry.transactionId)).size).toBe(3);
    expect(
      await database.one(
        RetryCounter,
        Sql.tag`select value, txid_current()::text as transaction_id from retry_counter where id = 1`,
      ),
    ).toMatchObject({ value: 2 });
    expect(
      events.filter((event) => event.text === "BEGIN ISOLATION LEVEL SERIALIZABLE"),
    ).toHaveLength(3);
    expect(events.filter((event) => event.text === "ROLLBACK")).toHaveLength(1);
    expect(events.filter((event) => event.text === "COMMIT")).toHaveLength(2);
    const rollbackIndex = events.findIndex((event) => event.text === "ROLLBACK");
    const retryBeginIndex = events.findIndex(
      (event, index) =>
        index > rollbackIndex && event.text === "BEGIN ISOLATION LEVEL SERIALIZABLE",
    );
    expect(rollbackIndex).toBeGreaterThanOrEqual(0);
    expect(retryBeginIndex).toBeGreaterThan(rollbackIndex);
  });

  it("stops at the attempt limit after real serialization conflicts on every attempt", async () => {
    const attempts: number[] = [];
    const transactionIds: bigint[] = [];
    const run = SerializationRetry.run(database, 2, async (tx, attempt) => {
      attempts.push(attempt);
      const row = await tx.one(
        RetryCounter,
        Sql.tag`select value, txid_current()::text as transaction_id from retry_counter where id = 1`,
      );
      transactionIds.push(row.transactionId);
      await database.transaction(
        async (other) => {
          await other.execute(Sql.tag`update retry_counter set value = value + 1 where id = 1`);
        },
        { isolation: "serializable" },
      );
      await tx.execute(Sql.tag`update retry_counter set value = ${row.value + 1} where id = 1`);
      return row.value + 1;
    });
    await expect(run).rejects.toBeInstanceOf(SerializationFailure);
    await expect(run).rejects.toMatchObject({ code: "40001" });
    expect(attempts).toEqual([1, 2]);
    expect(new Set(transactionIds).size).toBe(2);
    expect(
      await database.one(
        RetryCounter,
        Sql.tag`select value, txid_current()::text as transaction_id from retry_counter where id = 1`,
      ),
    ).toMatchObject({ value: 2 });
    expect(events.filter((event) => event.text === "ROLLBACK")).toHaveLength(2);
    expect(events.filter((event) => event.text === "COMMIT")).toHaveLength(2);
  });

  it("does not retry a real unique-constraint error", async () => {
    const attempts: number[] = [];
    const run = SerializationRetry.run(database, 3, async (tx, attempt) => {
      attempts.push(attempt);
      await tx.execute(Sql.tag`insert into retry_counter (id, value) values (${1}, ${99})`);
    });
    await expect(run).rejects.toBeInstanceOf(UniqueViolation);
    await expect(run).rejects.toMatchObject({ code: "23505" });
    expect(attempts).toEqual([1]);
    expect(
      await database.one(
        RetryCounter,
        Sql.tag`select value, txid_current()::text as transaction_id from retry_counter where id = 1`,
      ),
    ).toMatchObject({ value: 0 });
    expect(events.filter((event) => event.text === "ROLLBACK")).toHaveLength(1);
  });

  it("rejects an invalid attempt limit before starting a transaction", async () => {
    for (const limit of [0, -1, 1.5, Number.POSITIVE_INFINITY]) {
      await expect(
        SerializationRetry.run(database, limit, async () => "unreachable"),
      ).rejects.toBeInstanceOf(RangeError);
    }
    expect(events.some((event) => event.text.startsWith("BEGIN"))).toBe(false);
  });
});
