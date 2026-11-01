import { LoggerFactory } from "@glacier/logger";
import type { ILogEntry, ILogLevel, Logger, ITransport } from "@glacier/logger";
import { describe, expect, it } from "vitest";
import { DbFactory, QueryLogHook, Sql } from "@glacier/orm";
import type { IQueryEvent } from "@glacier/orm";
import { PostgresContainer } from "../../data/PostgresContainer.js";

/** Captures the entries delivered through the logger's public transport interface. */
class Entries implements ITransport {
  /** Entries received by this test-owned transport. */
  public readonly entries: ILogEntry[] = [];

  /**
   * Retains a delivered log entry for assertions.
   * @param entry Redacted logger entry.
   * @returns No value; appends the entry.
   */
  public write(entry: ILogEntry): void {
    this.entries.push(entry);
  }
}

/** Creates real loggers and observers for public integration scenarios. */
class QueryLoggingSetup {
  /**
   * Creates a real logger and its test-owned transport.
   * @param level Global minimum log level; defaults to debug.
   * @returns Logger and captured entries.
   * @throws {Error} If the test logger configuration or context is rejected.
   */
  public static logger(level: ILogLevel = "debug"): { logger: Logger; transport: Entries } {
    const transport = new Entries();
    const factory = LoggerFactory.create({ level, transports: [{ transport, format: "json" }] });
    if (factory.outcome !== "created") throw new Error("Invalid test logger configuration");
    const result = factory.factory.createLogger("database");
    if (result.outcome !== "created") throw new Error("Invalid test logger context");
    return { logger: result.logger, transport };
  }

  /**
   * Creates a hook from a valid threshold for scenario setup.
   * @param threshold Inclusive slow-query duration in milliseconds.
   * @param level Global minimum log level; defaults to debug.
   * @returns Observer and transport collecting its log entries.
   * @throws {Error} If the test hook configuration is rejected.
   */
  public static hook(
    threshold: number,
    level: ILogLevel = "debug",
  ): { hook: (event: IQueryEvent) => void; transport: Entries } {
    const { logger, transport } = this.logger(level);
    const result = QueryLogHook.create(logger, { slowQueryMs: threshold });
    if (result.outcome !== "created") throw new Error("Invalid test hook configuration");
    return { hook: result.hook, transport };
  }
}

describe("query logging", () => {
  it("rejects invalid configuration without revealing supplied values", () => {
    const { logger } = QueryLoggingSetup.logger();
    expect(QueryLogHook.create(null as never, { slowQueryMs: 1 })).toEqual({
      outcome: "rejected",
      reason: "invalid_logger",
    });
    for (const slowQueryMs of [-1, NaN, Infinity, -Infinity, "secret", undefined]) {
      expect(QueryLogHook.create(logger, { slowQueryMs: slowQueryMs as number })).toEqual({
        outcome: "rejected",
        reason: "invalid_slow_query_ms",
      });
    }
    expect(QueryLogHook.create(logger, null as never)).toEqual({
      outcome: "rejected",
      reason: "invalid_slow_query_ms",
    });
    expect(QueryLogHook.create(logger, { slowQueryMs: 0 }).outcome).toBe("created");
  });

  it("logs fixed messages at duration boundaries and error precedence without secrets", () => {
    const { hook, transport } = QueryLoggingSetup.hook(10);
    const event: IQueryEvent = {
      text: "select 'sql-literal-secret'",
      durationMs: 9.99,
      rowCount: [1, null],
      error: undefined,
    };
    hook(event);
    hook({ ...event, durationMs: 10 });
    hook({ ...event, durationMs: 11 });
    hook({
      ...event,
      durationMs: 0,
      error: new Error("error-message-secret", { cause: "cause-secret" }),
    });
    hook({ ...event, durationMs: 20, error: new Error("other-secret") });
    expect(
      transport.entries.map(({ level, message, fields }) => ({ level, message, fields })),
    ).toEqual([
      { level: "debug", message: "Database query completed", fields: { durationMs: 9.99 } },
      { level: "warn", message: "Slow database query", fields: { durationMs: 10 } },
      { level: "warn", message: "Slow database query", fields: { durationMs: 11 } },
      { level: "error", message: "Database query failed", fields: { durationMs: 0 } },
      { level: "error", message: "Database query failed", fields: { durationMs: 20 } },
    ]);
    expect(JSON.stringify(transport.entries)).not.toContain("secret");
    expect(transport.entries.every((entry) => entry.error === undefined)).toBe(true);
  });

  it("treats zero as an inclusive threshold and rejects malformed direct events", () => {
    const { hook, transport } = QueryLoggingSetup.hook(0);
    const event: IQueryEvent = { text: "", durationMs: 0, rowCount: null, error: undefined };
    hook(event);
    expect(transport.entries[0]?.level).toBe("warn");
    for (const durationMs of [-1, NaN, Infinity, "secret"]) {
      expect(() => hook({ ...event, durationMs: durationMs as number })).toThrow(
        "Invalid query duration",
      );
    }
    expect(transport.entries).toHaveLength(1);
  });

  it("respects logger filtering instead of forcing entries to transports", () => {
    const { hook, transport } = QueryLoggingSetup.hook(10, "error");
    const event: IQueryEvent = { text: "", durationMs: 0, rowCount: null, error: undefined };
    hook(event);
    hook({ ...event, durationMs: 10 });
    hook({ ...event, error: new Error("secret") });
    expect(transport.entries.map((entry) => entry.level)).toEqual(["error"]);
  });

  it("integrates with DbFactory against PostgreSQL without logging SQL literals or parameters", async () => {
    const postgres = await PostgresContainer.start();
    const schema = await postgres.createSchema();
    const { hook, transport } = QueryLoggingSetup.hook(0);
    const db = DbFactory.create({ poolConfig: schema.config, onQuery: hook });
    try {
      await db.execute(Sql.tag`select 'literal-secret', ${"parameter-secret"}::text`);
      await expect(db.execute(Sql.tag`select ${"failure-secret"}::integer`)).rejects.toThrow();
      expect(transport.entries.map((entry) => [entry.level, entry.message])).toEqual([
        ["warn", "Slow database query"],
        ["error", "Database query failed"],
      ]);
      expect(transport.entries.every((entry) => typeof entry.fields.durationMs === "number")).toBe(
        true,
      );
      expect(JSON.stringify(transport.entries)).not.toContain("secret");
    } finally {
      await db.close();
      await postgres.dropSchema(schema.name);
      await postgres.stop();
    }
  }, 120_000);
});
