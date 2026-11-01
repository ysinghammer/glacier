import { createHash, randomUUID } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import pg from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

/** Process result captured from the declared executable. */
interface ICliResult {
  /** Process exit code. */
  readonly status: number | null;
  /** Standard output and standard error. */
  readonly output: string;
}

/** Isolated directory and PostgreSQL schema used by one CLI scenario. */
class MigrationScenario {
  /** Test-owned directory retained as an artifact. */
  public readonly directory: string;
  /** PostgreSQL schema unique to this scenario. */
  public readonly schema: string;
  /** Connection URL restricted to the scenario's search path. */
  public readonly url: string;
  /** Administrative pool used for observable database effects. */
  private readonly admin: pg.Pool;

  /**
   * Constructs fixture paths for a running PostgreSQL container.
   * @param admin Administrative pool used for schema isolation.
   * @param connectionUrl Container connection URL.
   */
  public constructor(admin: pg.Pool, connectionUrl: string) {
    this.admin = admin;
    this.schema = `migration_${randomUUID().replaceAll("-", "")}`;
    const url = new URL(connectionUrl);
    url.searchParams.set("options", `-c search_path=${this.schema}`);
    this.url = url.toString();
    mkdirSync("tests/artifacts", { recursive: true });
    this.directory = mkdtempSync(resolve("tests/artifacts/migrations-"));
  }

  /**
   * Creates the schema for this scenario.
   * @returns A promise resolved after the schema exists.
   */
  public async start(): Promise<void> {
    await this.admin.query(`create schema "${this.schema}"`);
  }

  /**
   * Removes the isolated schema after all CLI processes exit.
   * @returns A promise resolved after schema removal.
   */
  public async stop(): Promise<void> {
    await this.admin.query(`drop schema "${this.schema}" cascade`);
  }

  /**
   * Writes test-owned file bytes to the migration directory.
   * @param name Directory-relative file name.
   * @param contents SQL or binary test input.
   * @returns No value after the write.
   */
  public write(name: string, contents: string | Buffer): void {
    writeFileSync(resolve(this.directory, name), contents);
  }

  /**
   * Executes a SQL assertion in the scenario schema.
   * @param sql SQL query containing only test-owned literals.
   * @returns Rows returned by PostgreSQL.
   */
  public async query(sql: string): Promise<pg.QueryResultRow[]> {
    const client = await this.admin.connect();
    try {
      await client.query(`set search_path to "${this.schema}"`);
      return (await client.query(sql)).rows;
    } finally {
      client.release();
    }
  }

  /**
   * Runs the package's declared executable with explicit arguments and environment.
   * @param args Arguments after the executable.
   * @param url DATABASE_URL fallback, or null to leave it unset.
   * @returns Exit code and output without interpreting private implementation state.
   */
  public cli(args: readonly string[], url: string | null = this.url): ICliResult {
    const result = spawnSync(MigrationScenario.executable(), args, {
      encoding: "utf8",
      env: { ...process.env, DATABASE_URL: url ?? undefined },
      timeout: 20_000,
    });
    if (result.error !== undefined) throw result.error;
    return { status: result.status, output: result.stdout + result.stderr };
  }

  /**
   * Starts the declared CLI asynchronously for concurrent migration scenarios.
   * @returns A promise for the exit status and combined output.
   */
  public async concurrentCli(): Promise<ICliResult> {
    const child = spawn(MigrationScenario.executable(), ["migrate", "--dir", this.directory], {
      env: { ...process.env, DATABASE_URL: this.url },
      stdio: ["ignore", "pipe", "pipe"],
      signal: AbortSignal.timeout(8_000),
    });
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (value: string) => {
      output += value;
    });
    child.stderr.on("data", (value: string) => {
      output += value;
    });
    return await new Promise((resolveResult, reject) => {
      child.once("error", reject);
      child.once("close", (status) => resolveResult({ status, output }));
    });
  }

  /**
   * Resolves the binary from the package's public manifest declaration.
   * @returns Absolute path to the declared CLI executable.
   */
  private static executable(): string {
    const manifest: { bin: { "glacier-orm": string } } = JSON.parse(
      readFileSync("package.json", "utf8"),
    );
    return resolve(manifest.bin["glacier-orm"]);
  }
}

describe("migration CLI against PostgreSQL", () => {
  let postgres: StartedPostgreSqlContainer;
  let admin: pg.Pool;
  let scenario: MigrationScenario;

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer("postgres:17-alpine").start();
    admin = new pg.Pool({ connectionString: postgres.getConnectionUri() });
  }, 120_000);
  afterAll(async () => {
    if (admin !== undefined) await admin.end();
    if (postgres !== undefined) await postgres.stop();
  }, 120_000);
  beforeEach(async () => {
    scenario = new MigrationScenario(admin, postgres.getConnectionUri());
    await scenario.start();
  });
  afterEach(async () => {
    await scenario.stop();
  });

  it("orders files, records byte checksums, and applies only new files", async () => {
    const first =
      "create table entries (value integer not null); insert into entries values (1);\n";
    scenario.write("0002_second.sql", "insert into entries values (2);\n");
    scenario.write("0001_first.sql", first);
    scenario.write("README.md", "ignored");
    const args = ["migrate", "--dir", scenario.directory];
    expect(scenario.cli(args)).toMatchObject({ status: 0, output: "Applied 2 migration(s).\n" });
    expect(await scenario.query("select value from entries order by value")).toEqual([
      { value: 1 },
      { value: 2 },
    ]);
    const history = await scenario.query(
      "select sequence, name, checksum from glacier_migrations order by sequence",
    );
    expect(history).toHaveLength(2);
    expect(history[0]).toEqual({
      sequence: 1,
      name: "0001_first.sql",
      checksum: createHash("sha256").update(first).digest("hex"),
    });
    expect(scenario.cli(args)).toMatchObject({ status: 0, output: "Applied 0 migration(s).\n" });
    scenario.write("0003_third.sql", "insert into entries values (3);\n");
    expect(scenario.cli(args)).toMatchObject({ status: 0, output: "Applied 1 migration(s).\n" });
  });

  it("rejects edited, renamed, and missing history without executing later SQL", async () => {
    scenario.write("0001_first.sql", "create table entries (value integer);\n");
    const args = ["migrate", "--dir", scenario.directory];
    expect(scenario.cli(args).status).toBe(0);
    scenario.write("0001_first.sql", "create table entries (value text);\n");
    scenario.write("0002_second.sql", "insert into entries values (9);\n");
    expect(scenario.cli(args)).toMatchObject({
      status: 1,
      output: "Migration history or checksum mismatch.\n",
    });
    expect(await scenario.query("select * from entries")).toEqual([]);
    unlinkSync(resolve(scenario.directory, "0001_first.sql"));
    scenario.write("0001_renamed.sql", "create table entries (value integer);\n");
    expect(scenario.cli(args).status).toBe(1);
    unlinkSync(resolve(scenario.directory, "0001_renamed.sql"));
    unlinkSync(resolve(scenario.directory, "0002_second.sql"));
    expect(scenario.cli(args)).toMatchObject({
      status: 1,
      output: "Migration history or checksum mismatch.\n",
    });
  });

  it("rejects malformed, duplicate, zero, and gapped SQL names", () => {
    const args = ["migrate", "--dir", scenario.directory];
    for (const names of [
      ["bad.sql"],
      ["0000_zero.sql"],
      ["0002_gap.sql"],
      ["0001_a.sql", "0001_b.sql"],
    ]) {
      for (const name of names) scenario.write(name, "select 1;\n");
      expect(scenario.cli(args)).toMatchObject({
        status: 1,
        output: "Invalid migration filename or sequence.\n",
      });
      for (const name of names) unlinkSync(resolve(scenario.directory, name));
    }
  });

  it("rolls back a failed file and permits a corrected retry", async () => {
    scenario.write("0001_failure.sql", "create table rolled_back (id integer); select 1 / 0;\n");
    const args = ["migrate", "--dir", scenario.directory];
    expect(scenario.cli(args).status).toBe(1);
    expect(await scenario.query("select to_regclass('rolled_back') as name")).toEqual([
      { name: null },
    ]);
    expect(await scenario.query("select * from glacier_migrations")).toEqual([]);
    scenario.write("0001_failure.sql", "create table rolled_back (id integer);\n");
    expect(scenario.cli(args).status).toBe(0);
    expect(await scenario.query("select count(*)::int as count from glacier_migrations")).toEqual([
      { count: 1 },
    ]);
  });

  it("executes the opt-out file outside a transaction for concurrent index creation", async () => {
    scenario.write("0001_table.sql", "create table entries (id integer);\n");
    scenario.write(
      "0002_index.sql",
      "-- glacier:no-transaction\r\ncreate index concurrently entries_idx on entries (id);\n",
    );
    expect(scenario.cli(["migrate", "--dir", scenario.directory]).status).toBe(0);
    expect(await scenario.query("select to_regclass('entries_idx') is not null as exists")).toEqual(
      [{ exists: true }],
    );
  });

  it("only recognizes the opt-out directive on the first line", async () => {
    scenario.write("0001_table.sql", "create table entries (id integer);\n");
    scenario.write(
      "0002_index.sql",
      "-- another comment\n-- glacier:no-transaction\ncreate index concurrently entries_idx on entries (id);\n",
    );
    const args = ["migrate", "--dir", scenario.directory];
    expect(scenario.cli(args).status).toBe(1);
    expect(
      await scenario.query("select sequence from glacier_migrations order by sequence"),
    ).toEqual([{ sequence: 1 }]);
    scenario.write(
      "0002_index.sql",
      "-- glacier:no-transaction\ncreate index concurrently entries_idx on entries (id);\n",
    );
    expect(scenario.cli(args).status).toBe(0);
  });

  it("leaves nontransactional SQL effects visible when recording fails", async () => {
    await scenario.query(
      "create table glacier_migrations (sequence integer primary key, name text not null unique, checksum text not null constraint deny_history check (false), applied_at timestamptz not null default now())",
    );
    scenario.write(
      "0001_partial.sql",
      "-- glacier:no-transaction\ncreate table partial_effect (id integer);\n",
    );
    expect(scenario.cli(["migrate", "--dir", scenario.directory]).status).toBe(1);
    expect(
      await scenario.query("select to_regclass('partial_effect') is not null as exists"),
    ).toEqual([{ exists: true }]);
    expect(await scenario.query("select * from glacier_migrations")).toEqual([]);
  });

  it("rejects modified history sequence numbers", async () => {
    scenario.write("0001_first.sql", "select 1;\n");
    const args = ["migrate", "--dir", scenario.directory];
    expect(scenario.cli(args).status).toBe(0);
    await scenario.query("update glacier_migrations set sequence = 2");
    expect(scenario.cli(args)).toMatchObject({
      status: 1,
      output: "Migration history or checksum mismatch.\n",
    });
  });

  it("releases a terminated session and reports failed rollback without secrets", async () => {
    scenario.write("0001_terminate.sql", "select pg_terminate_backend(pg_backend_pid());\n");
    const args = ["migrate", "--dir", scenario.directory];
    expect(scenario.cli(args)).toMatchObject({
      status: 1,
      output: "Migration failed; check the migration directory and database connection.\n",
    });
    scenario.write("0001_terminate.sql", "create table recovered (id integer);\n");
    expect(scenario.cli(args).status).toBe(0);
  });

  it("serializes concurrent CLI processes and applies each migration once", async () => {
    scenario.write(
      "0001_first.sql",
      "select pg_sleep(0.5); create table entries (id integer); insert into entries values (1);\n",
    );
    const [first, second] = await Promise.allSettled([
      scenario.concurrentCli(),
      scenario.concurrentCli(),
    ]);
    if (first.status !== "fulfilled" || second.status !== "fulfilled") {
      throw new AggregateError([first, second], "Concurrent CLI execution failed");
    }
    expect([first.value.status, second.value.status]).toEqual([0, 0]);
    expect([first.value.output, second.value.output].sort()).toEqual([
      "Applied 0 migration(s).\n",
      "Applied 1 migration(s).\n",
    ]);
    expect(await scenario.query("select * from entries")).toEqual([{ id: 1 }]);
  });

  it("rejects invalid CLI input and never prints URL or SQL secrets", () => {
    const secret = "private-test-secret";
    const badUrl = `postgresql://user:${secret}@127.0.0.1:1/db`;
    const cases: readonly string[][] = [
      [],
      ["unknown"],
      ["migrate"],
      ["migrate", "--dir"],
      ["migrate", "--dir", ""],
      ["migrate", "--other", "x"],
      ["migrate", "--dir", "--other"],
      ["migrate", "--dir", "a", "--dir", "b"],
      ["migrate", "--dir", "a", "--database-url", "x", "--database-url", "y"],
      ["migrate", "--dir", "a", "--database-url", "not-url"],
      ["migrate", "--dir", "a", "--database-url", "https://example.com"],
      ["migrate", "--dir", "a", "--database-url", "postgres:///db"],
    ];
    for (const args of cases) expect(scenario.cli(args, null).status).toBe(2);
    expect(scenario.cli(["migrate", "--dir", scenario.directory], null).status).toBe(2);
    expect(
      scenario.cli(
        ["migrate", "--dir", scenario.directory, "--database-url", scenario.url],
        "invalid-fallback",
      ).status,
    ).toBe(0);
    const failure = scenario.cli(
      ["migrate", "--dir", scenario.directory, "--database-url", badUrl],
      "invalid-fallback",
    );
    expect(failure.status).toBe(1);
    expect(failure.output).not.toContain(secret);
    scenario.write("0001_secret.sql", `do $$ begin raise exception '${secret}'; end $$;\n`);
    const sqlFailure = scenario.cli(["migrate", "--dir", scenario.directory]);
    expect(sqlFailure.status).toBe(1);
    expect(sqlFailure.output).not.toContain(secret);
  });

  it("rejects symbolic links, directories, invalid UTF-8, and missing directories safely", () => {
    const args = ["migrate", "--dir", scenario.directory];
    scenario.write("target", "select 1;\n");
    symlinkSync(
      resolve(scenario.directory, "target"),
      resolve(scenario.directory, "0001_link.sql"),
    );
    expect(scenario.cli(args).status).toBe(1);
    unlinkSync(resolve(scenario.directory, "0001_link.sql"));
    scenario.write("0001_invalid.sql", Buffer.from([0xff]));
    expect(scenario.cli(args).status).toBe(1);
    unlinkSync(resolve(scenario.directory, "0001_invalid.sql"));
    mkdirSync(resolve(scenario.directory, "0001_dir.sql"));
    expect(scenario.cli(args).status).toBe(1);
    expect(scenario.cli(["migrate", "--dir", resolve(scenario.directory, "missing")]).status).toBe(
      1,
    );
  });
});
